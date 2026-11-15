import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createHash } from 'crypto';
import { User } from '../users/entity/user.entity';
import { ProgressBatchDto, ProgressChangesDto } from './progress.dto';
import { incomingWins } from './progress-policy';

@Injectable()
export class ProgressService {
  constructor(private readonly db:DataSource) {}
  async batch(userId:string,dto:ProgressBatchDto) {
    return this.db.transaction(async manager=>{
      const owner=await manager.findOne(User,{where:{id:userId},lock:{mode:'pessimistic_write'}});
      if(!owner) throw new NotFoundException('Account not found');
      const acknowledgements:any[]=[];
      for(const raw of dto.mutations) {
        const mutation={...raw,mutation_id:raw.mutation_id.toLowerCase(),client_updated_at:new Date(raw.client_updated_at).toISOString()};
        const hash=createHash('sha256').update(JSON.stringify([mutation.item_type,mutation.item_id,mutation.status,mutation.client_updated_at])).digest('hex');
        const [receipt]=await manager.query('SELECT * FROM progress_receipts WHERE user_id=$1 AND mutation_id=$2',[userId,mutation.mutation_id]);
        if(receipt) {
          if(receipt.payload_hash!==hash) throw new ConflictException('Mutation ID was already used with different content');
          acknowledgements.push(receipt.outcome); continue;
        }
        const table=mutation.item_type==='vocabulary'?'vocabulary_items':'grammar_patterns';
        const join=mutation.item_type==='vocabulary'?'item.topic_id=topic.id':'item.topic_slug=topic.slug';
        const [reference]=await manager.query('SELECT topic.id AS topic_id,topic.level_code FROM '+table+' item JOIN topics topic ON '+join+' WHERE item.slug=$1',[mutation.item_id]);
        const future=new Date(mutation.client_updated_at).getTime()>Date.now()+5*60000;
        const [current]=await manager.query('SELECT * FROM learning_progress WHERE user_id=$1 AND item_type=$2 AND item_id=$3',
          [userId,mutation.item_type,mutation.item_id]);
        const [created]=await manager.query("INSERT INTO progress_receipts(user_id,mutation_id,payload_hash,outcome) VALUES($1,$2,$3,'{}') RETURNING version",
          [userId,mutation.mutation_id,hash]);
        let outcome:any;
        if(!reference || future) outcome={mutation_id:mutation.mutation_id,status:'rejected',
          message:future?'Device clock is too far ahead. Correct the clock and retry as a new edit.':'This learning item no longer exists.'};
        else if(incomingWins(current||null,mutation)) {
          const record={user_id:userId,...mutation,...reference,version:String(created.version)};
          await manager.query(`INSERT INTO learning_progress(user_id,item_type,item_id,status,client_updated_at,mutation_id,version,topic_id,level_code)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(user_id,item_type,item_id) DO UPDATE SET
            status=EXCLUDED.status,client_updated_at=EXCLUDED.client_updated_at,mutation_id=EXCLUDED.mutation_id,
            version=EXCLUDED.version,topic_id=EXCLUDED.topic_id,level_code=EXCLUDED.level_code`,
            [userId,mutation.item_type,mutation.item_id,mutation.status,mutation.client_updated_at,mutation.mutation_id,created.version,reference.topic_id,reference.level_code]);
          outcome={mutation_id:mutation.mutation_id,status:'accepted',record};
        } else outcome={mutation_id:mutation.mutation_id,status:'stale',record:current};
        await manager.query('UPDATE progress_receipts SET outcome=$1 WHERE version=$2',[outcome,created.version]);
        acknowledgements.push(outcome);
      }
      return {acknowledgements};
    });
  }
  async changes(userId:string,query:ProgressChangesDto) {
    const events=await this.db.query('SELECT version,outcome FROM progress_receipts WHERE user_id=$1 AND version>$2 ORDER BY version ASC LIMIT $3',
      [userId,query.after,query.limit+1]);
    const page=events.slice(0,query.limit);
    return {events:page.map((row:any)=>({version:String(row.version),...row.outcome})),
      cursor:page.length?String(page[page.length-1].version):query.after,has_more:events.length>query.limit};
  }
  async summary(userId:string) {
    const topics=await this.db.query(`SELECT t.id AS topic_id,t.level_code,t.title,
      ((SELECT count(*) FROM vocabulary_items v WHERE v.topic_id=t.id)+(SELECT count(*) FROM grammar_patterns g WHERE g.topic_slug=t.slug))::int AS total,
      (SELECT count(*)::int FROM learning_progress p WHERE p.user_id=$1 AND p.status='learned' AND
        ((p.item_type='vocabulary' AND EXISTS(SELECT 1 FROM vocabulary_items v WHERE v.slug=p.item_id AND v.topic_id=t.id)) OR
         (p.item_type='grammar' AND EXISTS(SELECT 1 FROM grammar_patterns g WHERE g.slug=p.item_id AND g.topic_slug=t.slug)))) AS learned
       FROM topics t ORDER BY t.level_code DESC,t."order",t.slug`,[userId]);
    const levels:any[]=[];
    for(const topic of topics) {
      let level=levels.find(l=>l.level_code===topic.level_code);
      if(!level) { level={level_code:topic.level_code,learned:0,total:0};levels.push(level); }
      level.learned+=topic.learned;level.total+=topic.total;
    }
    return {topics,levels};
  }
}
