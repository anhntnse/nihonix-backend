import {DEFAULT_LEARNING_SETTINGS} from '../users/dto/learning-settings.dto';
import {localDay} from '../learning-streaks/activity-policy';
import {Injectable,NotFoundException,BadRequestException,ConflictException} from '@nestjs/common';
import {DataSource,EntityManager} from 'typeorm';
import {randomUUID,createHash} from 'crypto';
import {PracticeSession} from './entity/practice-session.entity';
import {PracticeExercise} from './entity/practice-exercise.entity';
import {PracticeSubmission,PracticeCompletionEvent} from './entity/practice-submission.entity';
import {Topic} from '../topics/entity/topic.entity';
import {VocabularyItem} from '../vocabulary-items/entity/vocabulary-item.entity';
import {GrammarPattern} from '../grammar-patterns/entity/grammar-pattern.entity';
import {User} from '../users/entity/user.entity';
import {AiGenerationService} from '../ai/services/ai-generation.service';
import {AiService} from '../ai/services/ai.service';
import {AiRequestService,aiFailure} from '../ai/ai-request.service';
import {canonicalJson} from '../flashcards/sync/flashcard-policy';
import {practicePrompt,practiceOutput} from './practice-generation';
import {publicExercises,gradeAnswers} from './practice-policy';

@Injectable()
export class PracticeService{
 constructor(private readonly db:DataSource,private readonly generator:AiGenerationService,
  private readonly requests:AiRequestService,private readonly ai:AiService){}
 generateFillBlank(dto:any,user:string){return this.generate(dto,user,'fill_blank');}
 generateMultipleChoice(dto:any,user:string){return this.generate(dto,user,'multiple_choice');}
 private async generate(dto:any,user:string,kind:'fill_blank'|'multiple_choice'){
  const topic=await this.db.manager.findOne(Topic,{where:{id:dto.topic_id}});
  if(!topic)throw new NotFoundException('Topic not found');
  const words=await this.db.manager.find(VocabularyItem,{where:{topic_id:topic.id},order:{order:'ASC',slug:'ASC'},take:30});
  const grammar=await this.db.manager.find(GrammarPattern,{where:{topic_slug:topic.slug},order:{order:'ASC',slug:'ASC'},take:15});
  if(!words.length&&!grammar.length)throw new BadRequestException('This topic has no learning material yet.');
  if(!(await this.ai.healthCheck()).configured)throw aiFailure('AI_UNAVAILABLE',503,'AI is not configured.');
  const count=dto.exercise_count??10,id=dto.request_id??randomUUID(),payload={topic_id:topic.id,exercise_count:count};
  return this.requests.execute(user,id,kind,payload,async()=>{
   const response=await this.generator.generateWithRetry({prompt:practicePrompt(topic,words,grammar,kind,count),expectedCount:count,tokensPerItem:800,maxRetries:0,timeoutMs:45000});
   return practiceOutput(response.content,kind,count);
  },async(m,generated)=>{
   if(!await m.findOne(Topic,{where:{id:topic.id}}))throw new NotFoundException('Topic no longer exists');
   const session=await m.save(m.create(PracticeSession,{user_id:user,topic_id:topic.id,level_code:topic.level_code,
    exercise_type:kind,total_exercises:generated.length,status:'in_progress'}));
   const exercises=await m.save(PracticeExercise,generated.map((ex:any,index:number)=>m.create(PracticeExercise,{...ex,session_id:session.id,order_index:index+1})));
   return this.project(session,topic,exercises);
  });
 }
 private project(session:any,topic:any,exercises?:any[],result?:any){
  return {id:session.id,topic_id:session.topic_id,topic_title:topic?.title??{},level_code:session.level_code,
   exercise_type:session.exercise_type,total_exercises:session.total_exercises,status:session.status,
   correct_count:session.correct_count??null,accuracy:session.accuracy==null?null:Math.round(Number(session.accuracy)),
   total_time:session.total_time??null,completed_at:session.completed_at??null,created_at:session.created_at,
   exercises:exercises?publicExercises(exercises,session.status==='completed'):[],result:result??null};
 }
 async getPracticeSets(user:string,topicId?:string,exerciseType?:string,status?:string,page=1,pageSize=20){
  const where:any={user_id:user};if(topicId)where.topic_id=topicId;if(exerciseType)where.exercise_type=exerciseType;if(status)where.status=status;
  const [items,total]=await this.db.manager.findAndCount(PracticeSession,{where,relations:['topic'],order:{created_at:'DESC',id:'DESC'},skip:(page-1)*pageSize,take:pageSize});
  return {items:items.map(s=>this.project(s,s.topic)),total,page,page_size:pageSize,has_more:page*pageSize<total};
 }
 async getPracticeSetById(id:string,user:string){
  const session=await this.db.manager.findOne(PracticeSession,{where:{id,user_id:user},relations:['topic','exercises']});
  if(!session)throw new NotFoundException('Practice set not found');
  const submission=session.status==='completed'?await this.db.manager.findOne(PracticeSubmission,{where:{session_id:id,user_id:user}}):null;
  return this.project(session,session.topic,session.exercises.sort((a,b)=>a.order_index-b.order_index),submission?.result);
 }
 async submitPractice(dto:any,user:string){
  const requestId=(dto.request_id??randomUUID()).toLowerCase();
  const payload={session_id:dto.session_id,answers:[...dto.answers].map(a=>({exercise_id:a.exercise_id,user_answer:a.user_answer,time_spent:a.time_spent??0})).sort((a,b)=>a.exercise_id.localeCompare(b.exercise_id))};
  const hash=createHash('sha256').update(canonicalJson(payload)).digest('hex');
  return this.db.transaction(async m=>{
   const owner=await m.findOne(User,{where:{id:user},lock:{mode:'pessimistic_write'}});
   if(!owner)throw new NotFoundException('Account not found');
   const learningTimezone=typeof owner.learning_settings?.timezone==='string'?owner.learning_settings.timezone:DEFAULT_LEARNING_SETTINGS.timezone;
   const replay=await m.findOne(PracticeSubmission,{where:{user_id:user,request_id:requestId}});
   if(replay){if(replay.payload_hash!==hash)throw new ConflictException('Submission ID was already used with different answers');return replay.result;}
   const session=await m.findOne(PracticeSession,{where:{id:dto.session_id,user_id:user},relations:['exercises','topic']});
   if(!session)throw new NotFoundException('Practice set not found');
   const previous=await m.findOne(PracticeSubmission,{where:{session_id:session.id,user_id:user}});
   if(previous){if(previous.payload_hash!==hash)throw new ConflictException('Practice was already submitted with different answers');return previous.result;}
   if(session.status==='completed')throw new ConflictException('Practice is already completed. Reload the result.');
   const graded=gradeAnswers(session.exercises,payload.answers),completed=new Date(),completionId=randomUUID();
   for(const result of graded.results){
    const ex=session.exercises.find(e=>e.id===result.exercise_id)!;
    ex.user_answer=result.user_answer;ex.is_correct=result.is_correct;ex.time_spent=result.time_spent;
   }
   await m.save(PracticeExercise,session.exercises);
   session.status='completed';session.correct_count=graded.correct_count;session.accuracy=graded.accuracy;
   session.total_time=graded.total_time;session.completed_at=completed;await m.save(session);
   const result={request_id:requestId,session_id:session.id,topic_title:session.topic.title,completed_at:completed.toISOString(),
    completion_id:completionId,...graded};
   await m.save(m.create(PracticeSubmission,{session_id:session.id,user_id:user,request_id:requestId,payload_hash:hash,result}));
   await m.save(m.create(PracticeCompletionEvent,{id:completionId,user_id:user,session_id:session.id,kind:'practice_completed',
    completed_at:completed,duration_seconds:graded.total_time,schema_version:1,payload:{topic_id:session.topic_id,exercise_type:session.exercise_type,total:graded.total_exercises,correct:graded.correct_count,
     timezone:learningTimezone,
     activity_date:localDay(completed,learningTimezone)}}));
   return result;
  });
 }
}
