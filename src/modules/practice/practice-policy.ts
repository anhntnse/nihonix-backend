import {BadRequestException} from '@nestjs/common';
const text=(value:any,max:number)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
const invalid=()=>{throw new BadRequestException('Invalid practice questions or answers.');};
export function validateGenerated(exercises:any,kind:string,count:number):any[] {
  if(!Array.isArray(exercises)||exercises.length!==count||count<1||count>15)invalid();
  return exercises.map((ex:any)=>{
    if(!ex||ex.type!==kind||!text(ex.question?.text,2000)||!text(ex.explanation?.vi,2000)||!text(ex.explanation?.en,2000))invalid();
    for(const key of ['hint','context'])if(ex.question[key]!=null&&!text(ex.question[key],1000))invalid();
    if(kind==='multiple_choice'){
      if(!Array.isArray(ex.options)||ex.options.length!==4||new Set(ex.options.map((o:any)=>o.id)).size!==4||
        ex.options.some((o:any)=>!Number.isInteger(o.id)||o.id<1||o.id>4||!text(o.text,500))||
        new Set(ex.options.map((o:any)=>o.text.trim())).size!==4||!Number.isInteger(ex.correct_answer)||
        !ex.options.some((o:any)=>o.id===ex.correct_answer))invalid();
    }else if(kind==='fill_blank'){
      if(!text(ex.correct_answer,200)||!ex.question.text.includes('____'))invalid();
    }else invalid();
    return {type:kind,question:{text:ex.question.text,hint:ex.question.hint,context:ex.question.context},
      options:kind==='multiple_choice'?ex.options.map((o:any)=>({id:o.id,text:o.text})):null,
      correct_answer:ex.correct_answer,explanation:{vi:ex.explanation.vi,en:ex.explanation.en},
      vocabulary_tested:Array.isArray(ex.vocabulary_tested)?ex.vocabulary_tested.filter((v:any)=>text(v,100)).slice(0,20):[],
      grammar_tested:Array.isArray(ex.grammar_tested)?ex.grammar_tested.filter((v:any)=>text(v,100)).slice(0,20):[]};
  });
}
export function gradeAnswers(exercises:any[],answers:any[]){
  if(!exercises.length||!Array.isArray(answers)||answers.length!==exercises.length||new Set(answers.map(a=>a.exercise_id)).size!==answers.length)invalid();
  const normalize=(v:string)=>v.normalize('NFKC').trim().toLowerCase();
  const results=answers.map(answer=>{
    const ex=exercises.find(e=>e.id===answer.exercise_id);if(!ex)invalid();
    const time=answer.time_spent??0;if(!Number.isInteger(time)||time<0||time>3600)invalid();
    const choice=ex.type==='multiple_choice'||Array.isArray(ex.options)&&ex.options.length>0;
    if(choice){if(!Number.isInteger(answer.user_answer)||!ex.options?.some((o:any)=>o.id===answer.user_answer))invalid();}
    else if(!text(answer.user_answer,200))invalid();
    const is_correct=choice?answer.user_answer===ex.correct_answer:normalize(answer.user_answer)===normalize(String(ex.correct_answer));
    return {exercise_id:ex.id,user_answer:answer.user_answer,is_correct,correct_answer:ex.correct_answer,explanation:ex.explanation,time_spent:time};
  });
  const correct_count=results.filter(r=>r.is_correct).length;
  return {total_exercises:exercises.length,correct_count,accuracy:Math.round(correct_count*100/exercises.length),
    total_time:results.reduce((sum,r)=>sum+r.time_spent,0),results};
}
export function publicExercises(exercises:any[],completed:boolean):any[]{
  return exercises.map(ex=>({id:ex.id,type:ex.type,question:ex.question,options:ex.options,order:ex.order_index??ex.order,
    ...(completed?{correct_answer:ex.correct_answer,explanation:ex.explanation,user_answer:ex.user_answer,is_correct:ex.is_correct,time_spent:ex.time_spent}:{})}));
}
