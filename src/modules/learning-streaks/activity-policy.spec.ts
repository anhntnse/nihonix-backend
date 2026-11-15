import {splitActivity,summarizeDays,validateActivity,localDay} from './activity-policy';
const event={id:'11111111-1111-4111-8111-111111111111',activity_type:'vocabulary',occurred_at:'2026-11-15T16:59:30Z',duration_seconds:60,timezone:'Asia/Ho_Chi_Minh'};
describe('activity policy',()=>{
 it('splits a Vietnam midnight without losing seconds',()=>expect(splitActivity(event)).toEqual([{date:'2026-11-15',seconds:30},{date:'2026-11-16',seconds:30}]));
 it('keeps DST repeated-hour duration without inventing another day',()=>expect(splitActivity({...event,occurred_at:'2026-11-01T05:59:30Z',timezone:'America/New_York'})).toEqual([{date:'2026-11-01',seconds:60}]));
 it('uses configured local date across UTC month boundary',()=>expect(localDay(new Date('2026-12-01T00:30:00Z'),'America/New_York')).toBe('2026-11-30'));
 it('qualifies at60 seconds separately from the daily goal',()=>{
  const s=summarizeDays([{date:'2026-11-14',seconds:60},{date:'2026-11-15',seconds:59}], '2026-11-15',15);
  expect(s).toMatchObject({current_streak:1,longest_streak:1,today_seconds:59,today_minutes:0,is_today_completed:false,goal_completed:false});
 });
 it('continues yesterday until today completes and resets across a gap',()=>{
  expect(summarizeDays([{date:'2026-11-12',seconds:60},{date:'2026-11-13',seconds:60}], '2026-11-15',1)).toMatchObject({current_streak:0,longest_streak:2,total_learning_days:2});
  expect(summarizeDays([{date:'2026-11-14',seconds:60},{date:'2026-11-15',seconds:900}], '2026-11-15',15)).toMatchObject({current_streak:2,longest_streak:2,goal_completed:true});
 });
 it('merges same-day seconds before qualification',()=>expect(summarizeDays([{date:'2026-11-15',seconds:30},{date:'2026-11-15',seconds:30}], '2026-11-15',15)).toMatchObject({current_streak:1,today_seconds:60}));
 it('rejects invalid duration/timezone/future timestamps',()=>{
  const now=new Date('2026-11-15T17:00:00Z');
  expect(()=>validateActivity({...event,duration_seconds:301},now)).toThrow();
  expect(()=>validateActivity({...event,timezone:'bad-zone'},now)).toThrow();
  expect(()=>validateActivity({...event,occurred_at:'2026-11-16T00:00:00Z'},now)).toThrow();
  expect(()=>validateActivity(event,now)).not.toThrow();
 });
});
