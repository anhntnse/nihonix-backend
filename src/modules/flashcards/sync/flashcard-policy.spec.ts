import {validateMutation,dependencyVersion,canonicalJson} from './flashcard-policy';
const id='00000000-0000-4000-8000-000000000001';
const other='00000000-0000-4000-8000-000000000002';
const card={id,front:{text:'こんにちは',type:'text'},back:{text:'Hello',type:'text'},order:1};
const set={kind:'set',id,action:'upsert',base_version:'0',folder_id:other,name:'Greetings',cards:[card]};
describe('flashcard mutation policy',()=>{
  it('accepts an empty named set for later editing',()=>expect(validateMutation({...set,cards:[]})).toBeNull());
  it('rejects duplicate card IDs before bulk replacement',()=>expect(validateMutation({...set,cards:[card,card]})).toMatch(/duplicate/i));
  it('rejects blank faces without dropping other cards',()=>expect(validateMutation({...set,cards:[{...card,front:{text:'  ',type:'text'}}]})).toMatch(/front/i));
  it('bounds text and card count',()=>{
    expect(validateMutation({...set,cards:[{...card,back:{text:'x'.repeat(4001),type:'text'}}]})).toMatch(/back/i);
    expect(validateMutation({...set,cards:Array(201).fill(card)})).toMatch(/200/);
  });
  it('requires meaningful folder and set names',()=>expect(validateMutation({...set,name:'  '})).toMatch(/name/i));
  it('requires UUID parent on set writes',()=>expect(validateMutation({...set,folder_id:'other-user'})).toMatch(/folder/i));
  it('allows deletion without requiring card content',()=>expect(validateMutation({kind:'set',id,action:'delete',base_version:'2'})).toBeNull());
  it('chains immutable local edits to the accepted version',()=>expect(dependencyVersion(set,{status:'accepted',record:{kind:'set',id,version:'13'}})).toBe('13'));
  it('lets a later folder deletion depend on its child update',()=>expect(dependencyVersion({kind:'folder',id:other},{status:'accepted',parent:{kind:'folder',id:other,version:'14'}})).toBe('14'));
  it('never chains to a rejected or unrelated mutation',()=>{
    expect(dependencyVersion(set,{status:'conflict',record:{kind:'set',id,version:'13'}})).toBeNull();
    expect(dependencyVersion(set,{status:'accepted',record:{kind:'set',id:other,version:'13'}})).toBeNull();
  });
  it('canonicalizes receipt payloads independent of object key order',()=>expect(canonicalJson({name:'A',cards:[{back:2,front:1}]})).toBe(canonicalJson({cards:[{front:1,back:2}],name:'A'})));
});
