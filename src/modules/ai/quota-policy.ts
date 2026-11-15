export type GenerationKind='flashcards'|'fill_blank'|'multiple_choice';
export function quotaWindow(now:Date) {
  const day=new Date(now.getTime()+7*3600000).toISOString().slice(0,10);
  const resets_at=new Date(Date.parse(day+'T00:00:00Z')+24*3600000-7*3600000).toISOString();
  return {day,resets_at,timezone:'Asia/Ho_Chi_Minh'};
}
export function quotaBucket(kind:string):'flashcards'|'practice' {
  if(kind==='flashcards')return 'flashcards';
  if(kind==='fill_blank'||kind==='multiple_choice')return 'practice';
  throw new Error('Unsupported generation kind');
}
export function validateCount(count:number):string|null {
  return Number.isInteger(count)&&count>=1&&count<=15?null:'Choose between 1 and 15 items.';
}
