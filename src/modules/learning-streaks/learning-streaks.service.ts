import {Injectable,NotFoundException,ConflictException} from '@nestjs/common';
import {DataSource} from 'typeorm';
import {createHash} from 'crypto';
import {User} from '../users/entity/user.entity';
import {LearningActivityEvent} from './activity.entity';
import {DEFAULT_LEARNING_SETTINGS} from '../users/dto/learning-settings.dto';
import {canonicalJson} from '../flashcards/sync/flashcard-policy';
import {ActivityInput,localDay,splitActivity,summarizeDays,validateActivity} from './activity-policy';
@Injectable()
export class LearningStreaksService{
 constructor(private readonly db:DataSource){}
 async recordBatch(user:string,events:ActivityInput[]){
  return this.db.transaction(async m=>{
   if(!await m.findOne(User,{where:{id:user},lock:{mode:'pessimistic_write'}}))throw new NotFoundException('Account not found');
   const accepted:string[]=[];
   for(const input of events){
    const event={id:input.id.toLowerCase(),activity_type:input.activity_type,occurred_at:new Date(input.occurred_at).toISOString(),
     duration_seconds:input.duration_seconds,timezone:input.timezone,item_id:input.item_id??null};
    const hash=createHash('sha256').update(canonicalJson(event)).digest('hex');
    const old=await m.findOne(LearningActivityEvent,{where:{user_id:user,id:event.id}});
    if(old){if(old.payload_hash!==hash)throw new ConflictException('Activity ID was already used with different content');}
    else{
     validateActivity(input,new Date());
     await m.save(m.create(LearningActivityEvent,{...event,user_id:user,payload_hash:hash,occurred_at:new Date(event.occurred_at),slices:splitActivity(input)}));
    }
    accepted.push(event.id);
   }
   return {accepted};
  });
 }
 async settings(user:string){
  const owner=await this.db.manager.findOne(User,{where:{id:user}});if(!owner)throw new NotFoundException('Account not found');
  return {...DEFAULT_LEARNING_SETTINGS,...owner.learning_settings};
 }
 async days(user:string){
  return this.db.query("SELECT piece->>'date' AS date,sum((piece->>'seconds')::int)::int AS seconds FROM learning_activity_events e CROSS JOIN LATERAL jsonb_array_elements(e.slices) piece WHERE user_id=$1 GROUP BY piece->>'date' ORDER BY date",[user]);
 }
 async getStreak(user:string,now=new Date()){
  const settings=await this.settings(user),today=localDay(now,settings.timezone),rows=await this.days(user);
  return {...summarizeDays(rows,today,settings.daily_goal_minutes),today,timezone:settings.timezone,qualification_seconds:60};
 }
 async getCalendar(user:string,year?:number,month?:number,now=new Date()){
  const settings=await this.settings(user),today=localDay(now,settings.timezone);
  year=year??Number(today.slice(0,4));month=month??Number(today.slice(5,7));
  const prefix=String(year)+'-'+String(month).padStart(2,'0');
  const rows=await this.days(user);
  const completionRows=await this.db.query("SELECT coalesce(payload->>'activity_date',to_char(completed_at AT TIME ZONE 'UTC','YYYY-MM-DD')) AS date,count(*)::int AS count FROM practice_completion_events WHERE user_id=$1 GROUP BY date",[user]);
  const completion=new Map<string,number>(completionRows.map((r:any)=>[r.date,r.count]));
  const byDate=new Map<string,number>(rows.map((r:any)=>[r.date,r.seconds]));
  const dates=[...new Set([...byDate.keys(),...completion.keys()])].filter(d=>d.startsWith(prefix)).sort();
  return {year,month,timezone:settings.timezone,learning_days:dates.map(date=>{
   const seconds=byDate.get(date)??0;return {date,seconds,minutes:Math.floor(seconds/60),qualified:seconds>=60,
    goal_completed:seconds>=settings.daily_goal_minutes*60,practice_completions:completion.get(date)??0};
  }),total_days:dates.filter(d=>(byDate.get(d)??0)>=60).length};
 }
}
