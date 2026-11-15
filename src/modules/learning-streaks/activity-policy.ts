import {BadRequestException} from '@nestjs/common';
export type ActivityInput={id:string,activity_type:string,occurred_at:string,duration_seconds:number,timezone:string,item_id?:string};
function formatter(timezone:string){return new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'});}
function dateParts(format:Intl.DateTimeFormat,date:Date){const p=format.formatToParts(date);return ['year','month','day'].map(k=>p.find(v=>v.type===k)!.value).join('-');}
export function localDay(now:Date,timezone:string):string{return dateParts(formatter(timezone),now);}
export function splitActivity(event:ActivityInput):Array<{date:string,seconds:number}>{
 const format=formatter(event.timezone),start=new Date(event.occurred_at).getTime(),days=new Map<string,number>();
 for(let second=0;second<event.duration_seconds;second++){
  const day=dateParts(format,new Date(start+second*1000));days.set(day,(days.get(day)??0)+1);
 }
 return [...days].map(([date,seconds])=>({date,seconds}));
}
export function summarizeDays(rows:Array<{date:string,seconds:number}>,today:string,goal:number){
 const totals=new Map<string,number>();for(const row of rows)if(row.date<=today)totals.set(row.date,(totals.get(row.date)??0)+Number(row.seconds));
 const days=[...totals].filter(([,seconds])=>seconds>=60).map(([date])=>date).sort();
 let longest=0,run=0,previous:string|null=null,runStart:string|null=null;
 for(const day of days){
  const consecutive=previous!=null&&Date.parse(day+'T00:00:00Z')-Date.parse(previous+'T00:00:00Z')===86400000;
  run=consecutive?run+1:1;if(!consecutive)runStart=day;longest=Math.max(longest,run);previous=day;
 }
 const yesterday=new Date(Date.parse(today+'T00:00:00Z')-86400000).toISOString().slice(0,10);
 const current=previous===today||previous===yesterday?run:0,seconds=totals.get(today)??0;
 return {current_streak:current,longest_streak:longest,total_learning_days:days.length,last_learned_date:previous,
  streak_start_date:current?runStart:null,is_today_completed:seconds>=60,streak_status:current?'active':days.length?'broken':'new',
  today_seconds:seconds,today_minutes:Math.floor(seconds/60),daily_goal_minutes:goal,goal_completed:seconds>=goal*60};
}
export function validateActivity(event:ActivityInput,now:Date):void{
 const start=Date.parse(event.occurred_at);
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(event.id)||
  !['vocabulary','grammar','flashcards','practice'].includes(event.activity_type)||
  !Number.isInteger(event.duration_seconds)||event.duration_seconds<1||event.duration_seconds>300||
  !Number.isFinite(start)||start<now.getTime()-365*86400000||start+event.duration_seconds*1000>now.getTime()+300000||
  typeof event.timezone!=='string'||event.timezone.length>100||
  (event.item_id!==undefined&&(typeof event.item_id!=='string'||event.item_id.length>255)))throw new BadRequestException('Invalid activity segment');
 try{formatter(event.timezone);}catch{throw new BadRequestException('Invalid activity timezone');}
}
