import {validateGenerated,gradeAnswers,publicExercises} from './practice-policy';
const fill={type:'fill_blank',question:{text:'私は____です。'},correct_answer:'学生',explanation:{vi:'Học sinh',en:'Student'}};
const mc={type:'multiple_choice',question:{text:'Select cat'},options:[{id:1,text:'猫'},{id:2,text:'犬'},{id:3,text:'鳥'},{id:4,text:'魚'}],correct_answer:1,explanation:{vi:'Mèo',en:'Cat'}};
describe('practice output and grading policy',()=>{
  it('requires the exact requested count and type',()=>{expect(()=>validateGenerated([fill],'fill_blank',2)).toThrow();expect(()=>validateGenerated([mc],'fill_blank',1)).toThrow()});
  it('rejects malformed options and answers outside their IDs',()=>{
    expect(()=>validateGenerated([{...mc,correct_answer:5}],'multiple_choice',1)).toThrow();
    expect(()=>validateGenerated([{...mc,options:[mc.options[0],mc.options[0],...mc.options.slice(2)]}],'multiple_choice',1)).toThrow();
  });
  it('rejects blank or oversized output instead of saving partial content',()=>{
    expect(()=>validateGenerated([fill,{...fill,question:{text:' '}}],'fill_blank',2)).toThrow();
    expect(()=>validateGenerated([{...fill,correct_answer:'x'.repeat(201)}],'fill_blank',1)).toThrow();
  });
  it('accepts both types and hides grading fields before completion',()=>{
    expect(validateGenerated([fill],'fill_blank',1)).toHaveLength(1);expect(validateGenerated([mc],'multiple_choice',1)).toHaveLength(1);
    expect(publicExercises([{...fill,id:'a'}],false)[0]).not.toHaveProperty('correct_answer');
    expect(publicExercises([{...fill,id:'a'}],false)[0]).not.toHaveProperty('explanation');
    expect(publicExercises([{...fill,id:'a'}],true)[0].correct_answer).toBe('学生');
  });
  it('normalizes text width and whitespace without fuzzy answers',()=>{
    const exercises=[{...fill,id:'a',correct_answer:'ABC'}];
    expect(gradeAnswers(exercises,[{exercise_id:'a',user_answer:' ａｂｃ ',time_spent:2}]).correct_count).toBe(1);
    expect(gradeAnswers([{...fill,id:'a'}],[{exercise_id:'a',user_answer:'学生です'}]).correct_count).toBe(0);
  });
  it('requires every exercise once and rejects foreign IDs',()=>{
    const ex=[{...fill,id:'a'},{...fill,id:'b'}];
    expect(()=>gradeAnswers(ex,[{exercise_id:'a',user_answer:'学生'}])).toThrow();
    expect(()=>gradeAnswers(ex,[{exercise_id:'a',user_answer:'学生'},{exercise_id:'a',user_answer:'学生'}])).toThrow();
    expect(()=>gradeAnswers(ex,[{exercise_id:'a',user_answer:'学生'},{exercise_id:'foreign',user_answer:'学生'}])).toThrow();
  });
  it('validates time and answer types before writing results',()=>{
    expect(()=>gradeAnswers([{...mc,id:'a'}],[{exercise_id:'a',user_answer:'1'}])).toThrow();
    expect(()=>gradeAnswers([{...fill,id:'a'}],[{exercise_id:'a',user_answer:'学生',time_spent:-1}])).toThrow();
    expect(()=>gradeAnswers([{...fill,id:'a'}],[{exercise_id:'a',user_answer:'学生',time_spent:3601}])).toThrow();
  });
});
