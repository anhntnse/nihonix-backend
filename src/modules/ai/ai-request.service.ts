import {Injectable,HttpException,NotFoundException,ConflictException,Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {DataSource,EntityManager} from 'typeorm';
import {createHash} from 'crypto';
import {User} from '../users/entity/user.entity';
import {AiGenerationRequest} from './ai-request.entity';
import {quotaWindow,quotaBucket,GenerationKind} from './quota-policy';
import {canonicalJson} from '../flashcards/sync/flashcard-policy';

export function aiFailure(code:string,status:number,message:string):HttpException {return new HttpException({code,message},status);}
@Injectable()
export class AiRequestService {
 private readonly logger=new Logger(AiRequestService.name);
 constructor(private readonly db:DataSource,private readonly config:ConfigService){}
 private limit(bucket:string){
  const value=Number(this.config.get(bucket==='flashcards'?'AI_FLASHCARDS_DAILY_LIMIT':'AI_PRACTICE_DAILY_LIMIT')??(bucket==='flashcards'?2:3));
  if(!Number.isInteger(value)||value<0||value>100)throw aiFailure('AI_UNAVAILABLE',503,'AI quota configuration is unavailable.');
  return value;
 }
 private async lock(m:EntityManager,user:string){
  if(!await m.findOne(User,{where:{id:user},lock:{mode:'pessimistic_write'}}))throw new NotFoundException('Account not found');
  await m.query("UPDATE ai_generation_requests SET state='failed',error_code='AI_REQUEST_INTERRUPTED',error_status=503,updated_at=now() WHERE user_id=$1 AND state='reserved' AND lease_expires_at<=now()",[user]);
 }
 private snapshot(row:any){
  return {request_id:row.request_id,kind:row.kind,status:row.state,result:row.result??null,
   error:row.error_code?{code:row.error_code,status:row.error_status}:null};
 }
 private async usage(m:EntityManager,user:string,day:string,bucket:string){
  const [row]=await m.query(`SELECT count(*) FILTER(WHERE state='succeeded')::int AS used,
   count(*) FILTER(WHERE state='reserved')::int AS reserved FROM ai_generation_requests WHERE user_id=$1 AND day=$2 AND bucket=$3`,[user,day,bucket]);
  const limit=this.limit(bucket);
  return {limit,used:row.used,reserved:row.reserved,remaining:Math.max(0,limit-row.used-row.reserved)};
 }
 async quota(user:string){
  return this.db.transaction(async m=>{
   await this.lock(m,user);const window=quotaWindow(new Date());
   return {...window,max_items:15,buckets:{flashcards:await this.usage(m,user,window.day,'flashcards'),practice:await this.usage(m,user,window.day,'practice')}};
  });
 }
 async status(user:string,id:string){
  return this.db.transaction(async m=>{await this.lock(m,user);
   const row=await m.findOne(AiGenerationRequest,{where:{user_id:user,request_id:id}});
   if(!row)throw new NotFoundException('Generation request not found');return this.snapshot(row);
  });
 }
 async cancel(user:string,id:string){
  return this.db.transaction(async m=>{await this.lock(m,user);
   const row=await m.findOne(AiGenerationRequest,{where:{user_id:user,request_id:id}});
   if(!row)throw new NotFoundException('Generation request not found');
   if(row.state==='reserved'){
    row.state='cancelled';row.error_code='AI_REQUEST_CANCELLED';row.error_status=409;row.updated_at=new Date();await m.save(row);
    this.logger.log(JSON.stringify({event:'ai.cancelled',userId:user,requestId:id}));
   }
   return this.snapshot(row);
  });
 }
 async execute(user:string,id:string,kind:GenerationKind,payload:any,generate:()=>Promise<any>,
  persist:(m:EntityManager,generated:any)=>Promise<any>=async(_m,value)=>value){
  id=id.toLowerCase();const hash=createHash('sha256').update(canonicalJson({kind,payload})).digest('hex');
  const reservation=await this.db.transaction(async m=>{
   await this.lock(m,user);
   const before=await m.findOne(AiGenerationRequest,{where:{user_id:user,request_id:id}});
   if(before){
    if(before.payload_hash!==hash)throw new ConflictException('Request ID was already used with different content.');
    return {created:false,row:before};
   }
   const window=quotaWindow(new Date()),bucket=quotaBucket(kind),usage=await this.usage(m,user,window.day,bucket);
   if(usage.remaining===0)throw new HttpException({code:'AI_QUOTA_EXCEEDED',message:'Daily AI allowance has been reached.',
    bucket,resets_at:window.resets_at,timezone:window.timezone,...usage},429);
   // Cancelled calls may still be running on another process; retain their active slot until completion/lease expiry.
   const [active]=await m.query("SELECT count(*)::int AS n FROM ai_generation_requests WHERE user_id=$1 AND state IN ('reserved','cancelled') AND lease_expires_at>now()",[user]);
   if(active.n>=2)throw aiFailure('AI_GENERATION_BUSY',429,'Two AI requests are still finishing. Please wait before trying again.');
   const row=m.create(AiGenerationRequest,{user_id:user,request_id:id,kind,bucket,day:window.day,payload_hash:hash,state:'reserved',
    result:null,error_code:null,error_status:null,lease_expires_at:new Date(Date.now()+120000),created_at:new Date(),updated_at:new Date()});
   await m.save(row);return {created:true,row};
  });
  if(!reservation.created){
   if(reservation.row.state==='failed')throw aiFailure(reservation.row.error_code??'AI_GENERATION_FAILED',reservation.row.error_status??502,'Generation did not complete. Start a new request to retry.');
   return this.snapshot(reservation.row);
  }
  this.logger.log(JSON.stringify({event:'ai.reserved',userId:user,requestId:id,kind}));
  try{
   const generated=await generate();
   return await this.db.transaction(async m=>{
    await this.lock(m,user);
    const row=await m.findOneOrFail(AiGenerationRequest,{where:{user_id:user,request_id:id}});
    if(row.state!=='reserved'){row.lease_expires_at=new Date();row.updated_at=new Date();await m.save(row);return this.snapshot(row);}
    row.result=await persist(m,generated);row.state='succeeded';row.updated_at=new Date();await m.save(row);
    this.logger.log(JSON.stringify({event:'ai.succeeded',userId:user,requestId:id,kind}));
    return this.snapshot(row);
   });
  }catch(error:any){
   const response=error instanceof HttpException?error.getResponse():null;
   const code=typeof response==='object'&&response&&'code'in response?String(response.code):'AI_GENERATION_FAILED';
   const status=error instanceof HttpException?error.getStatus():502;
   await this.db.transaction(async m=>{
    const account=await m.findOne(User,{where:{id:user},lock:{mode:'pessimistic_write'}});if(!account)return;
    await m.query("UPDATE ai_generation_requests SET state='failed',error_code=$3,error_status=$4,lease_expires_at=now(),updated_at=now() WHERE user_id=$1 AND request_id=$2 AND state='reserved'",[user,id,code,status]);
    await m.query("UPDATE ai_generation_requests SET lease_expires_at=now(),updated_at=now() WHERE user_id=$1 AND request_id=$2 AND state='cancelled'",[user,id]);
   });
   this.logger.warn(JSON.stringify({event:'ai.failed',userId:user,requestId:id,kind,code}));
   throw aiFailure(code,status,'Generation could not be completed. Your successful allowance was not charged.');
  }
 }
}
