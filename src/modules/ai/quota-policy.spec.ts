import {quotaWindow,quotaBucket,validateCount} from './quota-policy';
describe('AI quota policy',()=>{
  it('uses the Vietnam calendar day before midnight',()=>expect(quotaWindow(new Date('2026-11-15T16:59:59Z'))).toEqual({day:'2026-11-15',resets_at:'2026-11-15T17:00:00.000Z',timezone:'Asia/Ho_Chi_Minh'}));
  it('resets at Vietnam midnight across month/year boundaries',()=>expect(quotaWindow(new Date('2026-12-31T17:00:00Z'))).toEqual({day:'2027-01-01',resets_at:'2027-01-01T17:00:00.000Z',timezone:'Asia/Ho_Chi_Minh'}));
  it('shares practice allowance but isolates flashcards',()=>{
    expect(quotaBucket('fill_blank')).toBe('practice');expect(quotaBucket('multiple_choice')).toBe('practice');expect(quotaBucket('flashcards')).toBe('flashcards');
  });
  it('bounds output to fifteen items',()=>{expect(validateCount(15)).toBeNull();expect(validateCount(16)).toMatch(/15/);expect(validateCount(0)).not.toBeNull();expect(validateCount(1.5)).not.toBeNull()});
});
