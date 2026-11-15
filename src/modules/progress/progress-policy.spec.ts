import { incomingWins } from './progress-policy';
describe('Progress conflict policy',()=>{
  const time='2026-11-15T00:00:00.000Z';
  it('accepts the first edit',()=>expect(incomingWins(null,{client_updated_at:time,mutation_id:'b'})).toBe(true));
  it('accepts a newer timestamp',()=>expect(incomingWins({client_updated_at:time,mutation_id:'b'},{client_updated_at:'2026-11-15T00:00:01.000Z',mutation_id:'a'})).toBe(true));
  it('rejects an older timestamp',()=>expect(incomingWins({client_updated_at:time,mutation_id:'a'},{client_updated_at:'2026-11-14T00:00:00.000Z',mutation_id:'z'})).toBe(false));
  it('uses mutation UUID order to break equal-time ties',()=>{
    expect(incomingWins({client_updated_at:time,mutation_id:'a'},{client_updated_at:time,mutation_id:'b'})).toBe(true);
    expect(incomingWins({client_updated_at:time,mutation_id:'b'},{client_updated_at:time,mutation_id:'a'})).toBe(false);
  });
  it('does not apply a retry twice',()=>expect(incomingWins({client_updated_at:time,mutation_id:'b'},{client_updated_at:time,mutation_id:'b'})).toBe(false));
});
