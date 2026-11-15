import {Injectable,ConflictException,NotFoundException,BadRequestException} from '@nestjs/common';
import {DataSource,EntityManager} from 'typeorm';
import {createHash,randomUUID} from 'crypto';
import {User} from '../../users/entity/user.entity';
import {FlashcardMutationDto} from './flashcard-sync.dto';
import {canonicalJson,dependencyVersion,validateMutation} from './flashcard-policy';
import {folderRecord,setRecord,entityRecord,writeHead} from './flashcard-records';

@Injectable()
export class FlashcardSyncService {
  constructor(private readonly db:DataSource) {}
  async batch(user:string,mutations:FlashcardMutationDto[]) {
    return this.db.transaction(async manager=>{
      if(!await manager.findOne(User,{where:{id:user},lock:{mode:'pessimistic_write'}})) throw new NotFoundException('Account not found');
      const acknowledgements:any[]=[];
      for(const raw of mutations) {
        const mutation={...raw,mutation_id:raw.mutation_id.toLowerCase(),id:raw.id.toLowerCase(),
          folder_id:raw.folder_id?.toLowerCase(),depends_on:raw.depends_on?.toLowerCase(),
          cards:raw.cards?.map(card=>({...card,id:card.id.toLowerCase()}))};
        const hash=createHash('sha256').update(canonicalJson(mutation)).digest('hex');
        const [receipt]=await manager.query('SELECT * FROM flashcard_sync_receipts WHERE user_id=$1 AND mutation_id=$2',[user,mutation.mutation_id]);
        if(receipt) {
          if(receipt.payload_hash!==hash) throw new ConflictException('Mutation ID was already used with different content');
          acknowledgements.push(receipt.outcome);continue;
        }
        const [created]=await manager.query("INSERT INTO flashcard_sync_receipts(user_id,mutation_id,payload_hash,outcome) VALUES($1,$2,$3,'{}') RETURNING version",
          [user,mutation.mutation_id,hash]);
        const version=String(created.version);
        const outcome=await this.apply(manager,user,mutation,version);
        await manager.query('UPDATE flashcard_sync_receipts SET outcome=$1 WHERE version=$2',[outcome,version]);
        acknowledgements.push(outcome);
      }
      return {acknowledgements};
    });
  }
  private async apply(db:EntityManager,user:string,m:any,version:string) {
    const base={mutation_id:m.mutation_id,kind:m.kind,id:m.id,version};
    const empty={folders:[],sets:[],cards:[]};
    const invalid=validateMutation(m);
    if(invalid)return {...base,status:'rejected',message:invalid,deleted_ids:empty};
    const current=await entityRecord(db,user,m.kind,m.id);
    const [head]=await db.query('SELECT * FROM flashcard_sync_heads WHERE user_id=$1 AND kind=$2 AND id=$3',[user,m.kind,m.id]);
    const table=m.kind==='folder'?'flashcard_folders':'flashcard_sets';
    if(!current && (await db.query('SELECT id FROM '+table+' WHERE id=$1',[m.id])).length)
      return {...base,status:'rejected',message:'Flashcard entity not found',deleted_ids:empty};
    let expected=m.base_version;
    if(m.depends_on) {
      const [dependency]=await db.query('SELECT outcome FROM flashcard_sync_receipts WHERE user_id=$1 AND mutation_id=$2',[user,m.depends_on]);
      expected=dependencyVersion(m,dependency?.outcome);
    }
    if(expected===null || head?.deleted || String(head?.version??'0')!==String(expected) || (m.action==='delete'&&!current))
      return {...base,status:'conflict',message:'Flashcards changed on another device. Keep your copy or use the server version.',
        current,deleted:!current,deleted_ids:empty};
    if(m.kind==='folder') {
      if(m.action==='delete') {
        const sets=await db.query('SELECT id FROM flashcard_sets WHERE folder_id=$1',[m.id]);
        const cards=await db.query('SELECT id FROM flashcards WHERE folder_id=$1',[m.id]);
        for(const set of sets) await writeHead(db,user,'set',set.id,version,true);
        await db.query('DELETE FROM flashcard_folders WHERE id=$1 AND user_id=$2',[m.id,user]);
        await writeHead(db,user,'folder',m.id,version,true);
        return {...base,status:'accepted',record:{kind:'folder',id:m.id,user_id:user,version,deleted:true},
          deleted_ids:{folders:[m.id],sets:sets.map((s:any)=>s.id),cards:cards.map((c:any)=>c.id)}};
      }
      const changedFolder=await db.query(`INSERT INTO flashcard_folders(id,user_id,name,description,"order",slug) VALUES($1,$2,$3,$4,$5,$6)
        ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,"order"=EXCLUDED."order",updated_at=now()
        WHERE flashcard_folders.user_id=EXCLUDED.user_id RETURNING id`,
        [m.id,user,m.name.trim(),m.description??null,m.order??1,'fc-'+m.id]);
      if(!changedFolder.length)return {...base,status:'rejected',message:'Flashcard entity not found',deleted_ids:empty};
      await writeHead(db,user,'folder',m.id,version);
      return {...base,status:'accepted',record:await folderRecord(db,user,m.id),deleted_ids:empty};
    }
    const folderId=current?.folder_id??m.folder_id;
    const parent=folderId?await folderRecord(db,user,folderId):null;
    if(!parent || (m.action==='upsert'&&m.folder_id!==folderId))
      return {...base,status:'rejected',message:'Parent folder not found or cannot be changed',deleted_ids:empty};
    const existing=current?.cards??[];
    if(m.action==='delete') {
      await db.query('DELETE FROM flashcard_sets WHERE id=$1',[m.id]);
      await writeHead(db,user,'set',m.id,version,true);
      await writeHead(db,user,'folder',folderId,version);
      return {...base,status:'accepted',record:{kind:'set',id:m.id,user_id:user,folder_id:folderId,version,deleted:true},
        parent:await folderRecord(db,user,folderId),deleted_ids:{folders:[],sets:[m.id],cards:existing.map((c:any)=>c.id)}};
    }
    if(m.cards.length) {
      const referenced=await db.query('SELECT id,set_id,folder_id FROM flashcards WHERE id=ANY($1::uuid[])',[m.cards.map((c:any)=>c.id)]);
      if(referenced.some((c:any)=>c.set_id!==m.id||c.folder_id!==folderId))
        return {...base,status:'rejected',message:'A card ID does not belong to this set',deleted_ids:empty};
    }
    // All validation and ownership checks precede deletion or updates.
    const retained=new Set(m.cards.map((c:any)=>c.id));
    const deleted=existing.filter((c:any)=>!retained.has(c.id)).map((c:any)=>c.id);
    const changedSet=await db.query(`INSERT INTO flashcard_sets(id,folder_id,name,"order",slug) VALUES($1,$2,$3,$4,NULL)
      ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,"order"=EXCLUDED."order",updated_at=now()
      WHERE flashcard_sets.folder_id=EXCLUDED.folder_id RETURNING id`,[m.id,folderId,m.name.trim(),m.order??1]);
    if(!changedSet.length)return {...base,status:'rejected',message:'Flashcard entity not found',deleted_ids:empty};
    if(deleted.length) await db.query('DELETE FROM flashcards WHERE set_id=$1 AND id=ANY($2::uuid[])',[m.id,deleted]);
    for(const [index,card] of m.cards.entries()) {
      const changedCard=await db.query(`INSERT INTO flashcards(id,folder_id,set_id,front,back,"order",slug) VALUES($1,$2,$3,$4,$5,$6,NULL)
        ON CONFLICT(id) DO UPDATE SET front=EXCLUDED.front,back=EXCLUDED.back,"order"=EXCLUDED."order",updated_at=now()
        WHERE flashcards.set_id=EXCLUDED.set_id AND flashcards.folder_id=EXCLUDED.folder_id RETURNING id`,
        [card.id,folderId,m.id,{...card.front,type:'text'},{...card.back,type:'text'},card.order??index+1]);
      // Roll back the complete aggregate if another owner won a concurrent card-ID insertion.
      if(!changedCard.length)throw new ConflictException('A card ID does not belong to this set');
    }
    await writeHead(db,user,'set',m.id,version);
    await writeHead(db,user,'folder',folderId,version);
    return {...base,status:'accepted',record:await setRecord(db,user,m.id),parent:await folderRecord(db,user,folderId),
      deleted_ids:{folders:[],sets:[],cards:deleted}};
  }
  async changes(user:string,after:string,limit:number) {
    // Bound bytes in PostgreSQL before materializing full snapshots in Node/mobile memory.
    // Always include one event so even the largest legal aggregate advances the cursor.
    const page=await this.db.query(`WITH limited AS (
      SELECT version,outcome FROM flashcard_sync_receipts WHERE user_id=$1 AND version>$2 ORDER BY version LIMIT $3
    ), sized AS (
      SELECT version,outcome,row_number() OVER(ORDER BY version) AS position,
        sum(octet_length(outcome::text)) OVER(ORDER BY version) AS bytes FROM limited
    ) SELECT version,outcome FROM sized WHERE position=1 OR bytes<=8388608 ORDER BY version`,[user,after,limit]);
    const cursor=page.length?String(page[page.length-1].version):after;
    const more=await this.db.query('SELECT 1 FROM flashcard_sync_receipts WHERE user_id=$1 AND version>$2 LIMIT 1',[user,cursor]);
    return {events:page.map((row:any)=>({...row.outcome,version:String(row.version)})),cursor,has_more:more.length>0};
  }
  async folders(user:string) {
    const rows=await this.db.query('SELECT id FROM flashcard_folders WHERE user_id=$1 ORDER BY "order",id',[user]);
    return Promise.all(rows.map((row:any)=>folderRecord(this.db.manager,user,row.id)));
  }
  async folder(user:string,idOrSlug:string) {
    const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const [row]=await this.db.query('SELECT id FROM flashcard_folders WHERE user_id=$1 AND '+(uuid?'id':'slug')+'=$2',[user,idOrSlug]);
    if(!row)throw new NotFoundException('Folder not found');
    return folderRecord(this.db.manager,user,row.id);
  }
  async set(user:string,id:string) {
    const record=await setRecord(this.db.manager,user,id);
    if(!record)throw new NotFoundException('Set not found');
    return record;
  }
  async sets(user:string,folderId:string) {
    await this.folder(user,folderId);
    const rows=await this.db.query('SELECT id FROM flashcard_sets WHERE folder_id=$1 ORDER BY "order",id',[folderId]);
    return Promise.all(rows.map((row:any)=>setRecord(this.db.manager,user,row.id)));
  }
  async legacy(user:string,mutation:Omit<FlashcardMutationDto,'mutation_id'>) {
    const result=await this.batch(user,[{...mutation,mutation_id:randomUUID()}]);
    const ack=result.acknowledgements[0];
    if(ack.status==='conflict')throw new ConflictException(ack.message);
    if(ack.status!=='accepted')throw new BadRequestException(ack.message);
    return ack;
  }
}
