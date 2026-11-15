import {Injectable,OnModuleInit,OnModuleDestroy,Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {DataSource} from 'typeorm';
import {randomUUID} from 'crypto';
import {User} from '../users/entity/user.entity';
import {NotificationDevice,ReminderAttempt} from './device.entity';
import {DEFAULT_LEARNING_SETTINGS} from '../users/dto/learning-settings.dto';
import {localDay,summarizeDays} from '../learning-streaks/activity-policy';
import {reminderDue} from './reminder-policy';
import {FcmProvider} from './fcm.provider';
@Injectable()
export class ReminderService implements OnModuleInit,OnModuleDestroy{
 private timer?:ReturnType<typeof setInterval>;private running=false;private readonly logger=new Logger(ReminderService.name);
 constructor(private readonly db:DataSource,private readonly config:ConfigService,private readonly provider:FcmProvider){}
 onModuleInit(){if(this.config.get('FCM_REMINDERS_ENABLED')==='true'&&this.provider.configured()){
  this.timer=setInterval(()=>{this.run().catch(()=>this.logger.warn('Reminder scan failed'));},30000);this.timer.unref();
 }}
 onModuleDestroy(){if(this.timer)clearInterval(this.timer);}
 async run(now=new Date()){
  if(this.running)return;this.running=true;
  try{
   let cursor='';
   for(;;){
    const owners=await this.db.query("SELECT DISTINCT user_id FROM notification_devices WHERE enabled=true AND user_id::text>$1 ORDER BY user_id LIMIT 100",[cursor]);
    if(!owners.length)break;
    for(const candidate of owners){
     cursor=candidate.user_id;
     await this.db.transaction(async m=>{
      const user=await m.findOne(User,{where:{id:candidate.user_id},lock:{mode:'pessimistic_write'}});
      if(!user||user.status!=='active'||!user.email_verified_at)return;
      const settings={...DEFAULT_LEARNING_SETTINGS,...user.learning_settings};
      if(!reminderDue(now,settings,false))return;
      const today=localDay(now,settings.timezone);
      const rows=await m.query("SELECT piece->>'date' AS date,sum((piece->>'seconds')::int)::int AS seconds FROM learning_activity_events e CROSS JOIN LATERAL jsonb_array_elements(e.slices) piece WHERE user_id=$1 GROUP BY piece->>'date'",[user.id]);
      if(summarizeDays(rows,today,settings.daily_goal_minutes).goal_completed)return;
      const devices=await m.query("SELECT d.* FROM notification_devices d INNER JOIN sessions s ON s.id=d.session_id AND s.user_id=d.user_id WHERE d.user_id=$1 AND d.enabled=true AND s.expires_at>$2 FOR SHARE OF s",[user.id,now]);
      if(!devices.length)return;
      const id=randomUUID();
      const claimed=await m.query("INSERT INTO reminder_attempts(user_id,day,id,status) VALUES($1,$2,$3,'claimed') ON CONFLICT(user_id,day) DO NOTHING RETURNING id",[user.id,today,id]);
      if(!claimed.length)return;
      // Persist the claim before crossing the network boundary: no retry after ambiguous provider acceptance.
      return {user:user.id,today,id,devices};
     }).then(async claim=>{
      if(!claim)return;
      for(const device of claim.devices){
       // Final transaction pins current settings/binding/session until the bounded send attempt exits.
       await this.db.transaction(async m=>{
        const user=await m.findOne(User,{where:{id:claim.user},lock:{mode:'pessimistic_write'}});
        if(!user||user.status!=='active'||!user.email_verified_at)return;
        const settings={...DEFAULT_LEARNING_SETTINGS,...user.learning_settings};
        const fresh=await m.query("SELECT d.* FROM notification_devices d INNER JOIN sessions s ON s.id=d.session_id AND s.user_id=d.user_id WHERE d.installation_id=$1 AND d.binding_id=$2 AND d.user_id=$3 AND d.enabled=true AND s.expires_at>$4 FOR SHARE OF s",[device.installation_id,device.binding_id,user.id,new Date()]);
        if(!fresh.length||!reminderDue(now,settings,false))return;
        const dayRows=await m.query("SELECT coalesce(sum((p->>'seconds')::int),0)::int AS seconds FROM learning_activity_events e CROSS JOIN LATERAL jsonb_array_elements(e.slices) p WHERE user_id=$1 AND p->>'date'=$2",[user.id,claim.today]);
        if(dayRows[0].seconds>=settings.daily_goal_minutes*60)return;
        const result=await this.provider.send(device.token,{schema_version:'1',type:'learning_reminder',destination:'activity',
         user_id:user.id,binding_id:device.binding_id,notification_id:claim.id});
        if(result==='invalid')await m.delete(NotificationDevice,{installation_id:device.installation_id,binding_id:device.binding_id});
        await m.update(ReminderAttempt,{user_id:user.id,day:claim.today},{status:result});
        this.logger.log(JSON.stringify({event:'reminder.attempt',userId:user.id,requestId:claim.id,status:result}));
       });
      }
     });
    }
   }
  }finally{this.running=false;}
 }
}
