import {Injectable} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {applicationDefault,initializeApp,getApps} from 'firebase-admin/app';
import {getMessaging} from 'firebase-admin/messaging';
@Injectable()
export class FcmProvider{
 constructor(private readonly config:ConfigService){}
 configured(){return !!this.config.get('FIREBASE_PROJECT_ID');}
 async send(token:string,data:Record<string,string>):Promise<'sent'|'invalid'|'unknown'>{
  if(!this.configured())return 'unknown';
  const name='nihonix-reminders';
  const app=getApps().find(a=>a.name===name)??initializeApp({projectId:this.config.get('FIREBASE_PROJECT_ID'),credential:applicationDefault()},name);
  let timer:ReturnType<typeof setTimeout>|undefined;
  try{
   await Promise.race([getMessaging(app).send({token,data,android:{priority:'normal',ttl:600000}}),
    new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('timeout')),15000);})]);
   return 'sent';
  }catch(error:any){return error.code==='messaging/registration-token-not-registered'?'invalid':'unknown';}
  finally{if(timer)clearTimeout(timer);}
 }
}
