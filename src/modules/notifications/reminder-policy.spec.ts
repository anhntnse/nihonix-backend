import {reminderDue} from './reminder-policy';
const settings={push_enabled:true,reminder_enabled:true,reminder_time:'20:00',timezone:'Asia/Ho_Chi_Minh'};
describe('reminder policy',()=>{
 it('uses settings timezone within the due window',()=>expect(reminderDue(new Date('2026-11-15T13:03:00Z'),settings,false)).toBe(true));
 it('does not send before the reminder or hours later',()=>{
  expect(reminderDue(new Date('2026-11-15T12:59:00Z'),settings,false)).toBe(false);
  expect(reminderDue(new Date('2026-11-15T14:00:00Z'),settings,false)).toBe(false);
 });
 it('skips opted out users and completed daily goals',()=>{
  expect(reminderDue(new Date('2026-11-15T13:03:00Z'),{...settings,push_enabled:false},false)).toBe(false);
  expect(reminderDue(new Date('2026-11-15T13:03:00Z'),settings,true)).toBe(false);
 });
 it('handles DST-local reminder time without fixed UTC offsets',()=>{
  expect(reminderDue(new Date('2026-11-01T06:32:00Z'),{...settings,timezone:'America/New_York',reminder_time:'01:30'},false)).toBe(true);
 });
});
