import {Injectable,UnauthorizedException,NotFoundException} from '@nestjs/common';
import {DataSource} from 'typeorm';
import {randomUUID} from 'crypto';
import {NotificationDevice} from './device.entity';
import {Session} from '../auth/entity/session.entity';
import {User} from '../users/entity/user.entity';
@Injectable()
export class NotificationsService{
 constructor(private readonly db:DataSource){}
 async register(user:string,session:string,installation:string,token:string,enabled:boolean){
  return this.db.transaction(async m=>{
   await m.query("SELECT pg_advisory_xact_lock(hashtext('nihonix-notification-bindings'))");
   if(!await m.findOne(User,{where:{id:user},lock:{mode:'pessimistic_write'}}))throw new NotFoundException('Account not found');
   const auth=await m.findOne(Session,{where:{id:session,user_id:user}});
   if(!auth?.expires_at||auth.expires_at<=new Date())throw new UnauthorizedException('Session expired');
   await m.createQueryBuilder().delete().from(NotificationDevice).where('token=:token AND installation_id<>:installation',{token,installation}).execute();
   const previous=await m.findOne(NotificationDevice,{where:{installation_id:installation}});
   const same=previous?.user_id===user&&previous?.session_id===session&&previous?.token===token&&previous?.enabled===enabled;
   const device=m.create(NotificationDevice,{installation_id:installation,user_id:user,session_id:session,token,enabled,
    binding_id:same?previous!.binding_id:randomUUID(),updated_at:new Date()});
   await m.save(device);return {installation_id:installation,binding_id:device.binding_id,enabled};
  });
 }
 async remove(user:string,session:string,installation:string){await this.db.manager.delete(NotificationDevice,{user_id:user,session_id:session,installation_id:installation});return {removed:true};}
}
