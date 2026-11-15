export function reminderDue(now:Date,settings:any,goalCompleted:boolean):boolean{
 if(!settings.push_enabled||!settings.reminder_enabled||goalCompleted||!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(settings.reminder_time??''))return false;
 try{
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone:settings.timezone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
  const minute=Number(parts.find(p=>p.type==='hour')!.value)*60+Number(parts.find(p=>p.type==='minute')!.value);
  const [h,m]=settings.reminder_time.split(':').map(Number),elapsed=minute-h*60-m;
  return elapsed>=0&&elapsed<10;
 }catch{return false;}
}
