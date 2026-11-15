/** Actual local PostgreSQL/HTTP; unique schema only, no real mail or AI. */
import 'reflect-metadata';
import {configureFlashcardBodies} from '../src/modules/flashcards/sync/flashcard-body-parser';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {DataSource} from 'typeorm';
import {Test} from '@nestjs/testing';
import {TypeOrmModule} from '@nestjs/typeorm';
import {ConfigModule} from '@nestjs/config';
import {ValidationPipe} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import request from 'supertest';
import {AppDataSource} from '../data-source';
import {AuthModule} from '../src/modules/auth/auth.module';
import {EmailService} from '../src/modules/auth/services/email.service';
import {FlashcardsModule} from '../src/modules/flashcards/flashcards.module';
import {FlashcardFoldersModule} from '../src/modules/flashcard-folders/flashcard-folders.module';
import {AiGenerationService} from '../src/modules/ai/services/ai-generation.service';
import {ResponseInterceptor} from '../src/common/interceptors/response.interceptor';
import {GlobalExceptionFilter} from '../src/common/filters/global-exception.filter';
import {PersonalFlashcards1794786400000} from '../src/database/migrations/1794786400000-PersonalFlashcards';

let stage='preflight';
async function run() {
  assert.ok(['localhost','127.0.0.1','::1'].includes(String((AppDataSource.options as any).host).toLowerCase()),'Local database required');
  const schema='sprint06_test_'+randomUUID().replace(/-/g,'');
  const options:any={...AppDataSource.options,schema,synchronize:false,migrationsRun:false,uuidExtension:'pgcrypto',installExtensions:false,logging:false,
    extra:{...(AppDataSource.options as any).extra,options:'-c search_path='+schema}};
  const db=new DataSource(options);let created=false;let app:any;let aiCalls=0;
  try {
    await db.initialize();await db.query('CREATE SCHEMA "'+schema+'"');created=true;
    assert.equal((await db.query('SELECT current_schema() AS name'))[0].name,schema);
    await db.synchronize();
    stage='migration-preserves-legacy';
    const legacy=randomUUID();
    await db.query('INSERT INTO flashcard_folders(id,name) VALUES($1,$2)',[legacy,'Unowned legacy']);
    const runner=db.createQueryRunner();const migration=new PersonalFlashcards1794786400000();
    await migration.down(runner);await migration.up(runner);
    assert.equal((await db.query('SELECT user_id,name FROM flashcard_folders WHERE id=$1',[legacy]))[0].user_id,null);
    await runner.release();
    const codes=new Map<string,string>();
    const module=await Test.createTestingModule({imports:[
      ConfigModule.forRoot({isGlobal:true,ignoreEnvFile:true,load:[()=>({jwt:{secret:'sprint06-access',refreshSecret:'sprint06-refresh',expiresIn:'15m',refreshExpiresIn:'7d'},bcrypt:{rounds:4}})]}),
      TypeOrmModule.forRoot(options),AuthModule,FlashcardsModule,FlashcardFoldersModule
    ]}).overrideProvider(EmailService).useValue({sendEmailVerificationCode:async(email:string,code:string)=>{codes.set(email,code)}})
      .overrideProvider(AiGenerationService).useValue({generateWithRetry:async()=>{aiCalls++;throw new Error('AI must not run')}}).compile();
    app=module.createNestApplication();configureFlashcardBodies(app);app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({whitelist:true,forbidNonWhitelisted:true,transform:true}));
    app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));app.useGlobalFilters(new GlobalExceptionFilter());await app.init();
    const api=request(app.getHttpServer());
    const login=async(name:string)=>{
      const email=name+'@example.test';const password='password123';
      const registration=await api.post('/api/auth/register').send({username:name,email,password}).expect(201);
      await api.post('/api/auth/verify-email').send({email,code:codes.get(email)}).expect(200);
      const result=await api.post('/api/auth/login').send({username:name,password}).expect(200);
      return {token:result.body.data.accessToken||result.body.data.access_token,id:registration.body.data.user.id};
    };
    const a=await login('sprint06a'),b=await login('sprint06b');
    const send=async(mutations:any[],actor=a,status=200)=>(await api.post('/api/flashcards/sync/batch').auth(actor.token,{type:'bearer'})
      .set('X-Nihonix-Account',actor.id).send({mutations}).expect(status)).body.data;
    const op=(kind:string,id:string,action='upsert',extra:any={})=>({mutation_id:randomUUID(),kind,id,action,base_version:'0',...extra});
    const face=(text:string)=>({text,type:'text'});
    const folderA=randomUUID(),folderB=randomUUID(),setA=randomUUID(),setB=randomUUID(),cardA=randomUUID(),cardB=randomUUID();
    stage='owners-and-legacy-isolation';
    await api.get('/api/flashcard-folders').expect(401);
    assert.equal((await api.get('/api/flashcard-folders').auth(a.token,{type:'bearer'}).expect(200)).body.data.length,0);
    for(const actor of [a,b]) await api.get('/api/flashcard-folders/'+legacy).auth(actor.token,{type:'bearer'}).expect(404);
    const fa=op('folder',folderA,'upsert',{name:'私のカード',description:'Private'});
    const fb=op('folder',folderB,'upsert',{name:'Other account'});
    const ackA=(await send([fa])).acknowledgements[0];assert.equal(ackA.status,'accepted');
    await send([fb],b);
    assert.deepEqual((await send([fa])).acknowledgements[0],ackA);
    await send([{...fa,name:'Different payload'}],a,409);
    for(const path of ['/api/flashcard-folders/'+folderA,'/api/flashcards/sets?folderId='+folderA])
      await api.get(path).auth(b.token,{type:'bearer'}).expect(404);
    await api.put('/api/flashcard-folders/'+folderA).auth(b.token,{type:'bearer'}).send({name:'Stolen'}).expect(404);
    await api.delete('/api/flashcard-folders/'+folderA).auth(b.token,{type:'bearer'}).expect(404);
    stage='sets-and-atomic-bulk';
    const makeSet=(id:string,folder:string,card:string)=>op('set',id,'upsert',{folder_id:folder,name:'Greetings',
      cards:[{id:card,front:face('こんにちは'),back:face('Hello'),order:1}]});
    const sa=makeSet(setA,folderA,cardA),sb=makeSet(setB,folderB,cardB);
    const setAck=(await send([sa])).acknowledgements[0];assert.equal(setAck.status,'accepted');assert.ok(setAck.parent.version);
    await send([sb],b);
    const attack=makeSet(randomUUID(),folderB,randomUUID());
    assert.equal((await send([attack])).acknowledgements[0].status,'rejected');
    await api.get('/api/flashcards/sets/'+setA+'/cards').auth(b.token,{type:'bearer'}).expect(404);
    await api.delete('/api/flashcards/sets/'+setA).auth(b.token,{type:'bearer'}).expect(404);
    const currentCards=(await api.get('/api/flashcards/sets/'+setA+'/cards').auth(a.token,{type:'bearer'}).expect(200)).body.data;
    await api.put('/api/flashcards/bulk').auth(a.token,{type:'bearer'}).send({set_id:setA,set_name:'Should not change',
      cards:[{id:cardB,front:face('hacked'),back:face('hacked')}]}).expect(400);
    assert.deepEqual((await api.get('/api/flashcards/sets/'+setA+'/cards').auth(a.token,{type:'bearer'}).expect(200)).body.data,currentCards);
    assert.equal((await db.query('SELECT name FROM flashcard_sets WHERE id=$1',[setA]))[0].name,'Greetings');
    const stolen={...sa,mutation_id:randomUUID(),base_version:setAck.record.version,name:'Invalid replacement',
      cards:[{id:cardB,front:face('hacked'),back:face('hacked')}]};
    assert.equal((await send([stolen])).acknowledgements[0].status,'rejected');
    assert.equal((await db.query('SELECT front FROM flashcards WHERE id=$1',[cardB]))[0].front.text,'こんにちは');
    stage='duplicates-and-validation';
    await send([{...sa,mutation_id:randomUUID(),cards:[sa.cards[0],sa.cards[0]]}]).then(result=>assert.equal(result.acknowledgements[0].status,'rejected'));
    await send([{...sa,mutation_id:randomUUID(),cards:[{...sa.cards[0],front:face(' ')}]}],a,400);
    await api.post('/api/flashcards/sync/batch').auth(b.token,{type:'bearer'}).set('X-Nihonix-Account',a.id).send({mutations:[sa]}).expect(409);
    stage='cross-owner-fresh-UUID-races';
    await db.query("CREATE FUNCTION flashcard_race_delay() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN PERFORM pg_sleep(0.15); RETURN NEW; END $$");
    for(const table of ['flashcard_folders','flashcard_sets','flashcards'])
      await db.query('CREATE TRIGGER delay_fresh_insert BEFORE INSERT ON '+table+' FOR EACH ROW EXECUTE FUNCTION flashcard_race_delay()');
    const sharedFolder=randomUUID();
    const folderRace=await Promise.all([send([op('folder',sharedFolder,'upsert',{name:'Owner A'})],a),send([op('folder',sharedFolder,'upsert',{name:'Owner B'})],b)]);
    assert.deepEqual(folderRace.map(x=>x.acknowledgements[0].status).sort(),['accepted','rejected']);
    const [ownerRow]=await db.query('SELECT user_id,name FROM flashcard_folders WHERE id=$1',[sharedFolder]);
    assert.equal(ownerRow.name,ownerRow.user_id===a.id?'Owner A':'Owner B');
    const raceParentA=randomUUID(),raceParentB=randomUUID();
    await send([op('folder',raceParentA,'upsert',{name:'Race parent A'})],a);
    await send([op('folder',raceParentB,'upsert',{name:'Race parent B'})],b);
    const sharedSet=randomUUID();
    const setRace=await Promise.all([send([makeSet(sharedSet,raceParentA,randomUUID())],a),send([makeSet(sharedSet,raceParentB,randomUUID())],b)]);
    assert.deepEqual(setRace.map(x=>x.acknowledgements[0].status).sort(),['accepted','rejected']);
    const sharedCard=randomUUID(),targetA=randomUUID(),targetB=randomUUID();
    const raceRequest=(actor:any,id:string,parent:string,text:string)=>api.post('/api/flashcards/sync/batch').auth(actor.token,{type:'bearer'})
      .set('X-Nihonix-Account',actor.id).send({mutations:[{...makeSet(id,parent,sharedCard),cards:[{id:sharedCard,front:face(text),back:face(text)}]}]});
    const cardRace=await Promise.all([raceRequest(a,targetA,raceParentA,'Owner A'),raceRequest(b,targetB,raceParentB,'Owner B')]);
    assert.deepEqual(cardRace.map(x=>x.status).sort(),[200,409]);
    const [cardOwner]=await db.query('SELECT c.front,f.user_id FROM flashcards c JOIN flashcard_sets s ON s.id=c.set_id JOIN flashcard_folders f ON f.id=s.folder_id WHERE c.id=$1',[sharedCard]);
    assert.equal(cardOwner.front.text,cardOwner.user_id===a.id?'Owner A':'Owner B');
    const loser=cardOwner.user_id===a.id?targetB:targetA;
    assert.equal((await db.query('SELECT count(*)::int AS n FROM flashcard_sets WHERE id=$1',[loser]))[0].n,0);
    for(const table of ['flashcard_folders','flashcard_sets','flashcards'])await db.query('DROP TRIGGER delay_fresh_insert ON '+table);
    await db.query('DROP FUNCTION flashcard_race_delay()');
    stage='concurrent-cas-and-dependencies';
    const left={...sa,mutation_id:randomUUID(),base_version:setAck.record.version,name:'Device one'};
    const right={...left,mutation_id:randomUUID(),name:'Device two'};
    const outcomes=(await Promise.all([send([left]),send([right])])).map(x=>x.acknowledgements[0]);
    assert.deepEqual(outcomes.map(x=>x.status).sort(),['accepted','conflict']);
    const winner=outcomes.find(x=>x.status==='accepted');
    const next={...sa,mutation_id:randomUUID(),base_version:setAck.record.version,depends_on:winner.mutation_id,name:'Edit while first request was in flight'};
    const chained=(await send([next])).acknowledgements[0];assert.equal(chained.status,'accepted');
    const staleFolderDelete=op('folder',folderA,'delete',{base_version:ackA.record.version});
    assert.equal((await send([staleFolderDelete])).acknowledgements[0].status,'conflict');
    const newCard=randomUUID();
    const reduced={...next,mutation_id:randomUUID(),depends_on:next.mutation_id,cards:[{id:newCard,front:face('ありがとう'),back:face('Thank you')}]};
    const reducedAck=(await send([reduced])).acknowledgements[0];
    assert.equal(reducedAck.status,'accepted');assert.deepEqual(reducedAck.deleted_ids.cards,[cardA]);
    stage='deletion-tombstones';
    const deletion=op('folder',folderA,'delete',{base_version:'0',depends_on:reduced.mutation_id});
    const deleted=(await send([deletion])).acknowledgements[0];
    assert.equal(deleted.status,'accepted');assert.deepEqual(deleted.deleted_ids.sets,[setA]);assert.deepEqual(deleted.deleted_ids.cards,[newCard]);
    assert.equal((await send([{...sa,mutation_id:randomUUID()}])).acknowledgements[0].status,'conflict');
    assert.equal((await db.query('SELECT count(*)::int AS n FROM flashcards WHERE set_id=$1',[setA]))[0].n,0);
    stage='owner-delta';
    let cursor='0';const events:any[]=[];
    for(let i=0;i<100;i++) {
      const data=(await api.get('/api/flashcards/sync/changes').query({after:cursor,limit:2}).auth(a.token,{type:'bearer'}).expect(200)).body.data;
      events.push(...data.events);cursor=data.cursor;if(!data.has_more)break;
    }
    assert.equal(new Set(events.map(x=>x.version)).size,events.length);
    assert.ok(events.some(x=>x.deleted_ids.sets.includes(setA)));
    assert.ok(events.every(x=>x.record?.user_id!==b.id));
    const other=(await api.get('/api/flashcards/sync/changes').auth(b.token,{type:'bearer'}).expect(200)).body.data;
    assert.ok(other.events.every((x:any)=>x.id!==folderA&&x.id!==setA));
    stage='legacy-owned-crud';
    const legacyOwned=(await api.post('/api/flashcard-folders').auth(a.token,{type:'bearer'}).send({name:'Owned via existing route'}).expect(201)).body.data;
    const legacySet=(await api.post('/api/flashcards').auth(a.token,{type:'bearer'}).send({folder_id:legacyOwned.id,set_name:'New set',
      cards:[{front:face('猫'),back:face('Cat')}]}).expect(201)).body.data;
    const edited=(await api.put('/api/flashcards/bulk').auth(a.token,{type:'bearer'}).send({set_id:legacySet.set_id,set_name:'Renamed',cards:[]}).expect(200)).body.data;
    assert.equal(edited.deleted,1);assert.equal(edited.cards.length,0);
    await api.delete('/api/flashcards/sets/'+legacySet.set_id).auth(a.token,{type:'bearer'}).expect(200);
    await api.post('/api/flashcards/generate').auth(a.token,{type:'bearer'}).send({folder_id:folderB,set_name:'Not allowed'}).expect(404);
    assert.equal(aiCalls,0);
    stage='large-japanese-bulk';
    const large=op('set',randomUUID(),'upsert',{folder_id:folderB,name:'Large Japanese set',cards:Array.from({length:200},(_,i)=>({id:randomUUID(),front:face('あ'.repeat(4000)),back:face('い'.repeat(4000)),order:i+1}))});
    const largeAck=(await send([large],b)).acknowledgements[0];assert.equal(largeAck.status,'accepted');
    const revised={...large,mutation_id:randomUUID(),base_version:largeAck.record.version,name:'Revised large set'};
    assert.equal((await send([revised],b)).acknowledgements[0].status,'accepted');
    stage='bounded-large-delta';
    const largePage=(await api.get('/api/flashcards/sync/changes').auth(b.token,{type:'bearer'}).expect(200)).body.data;
    assert.ok(Buffer.byteLength(JSON.stringify(largePage.events))<=8*1024*1024,'Delta page must bound full aggregate snapshots');
    assert.equal(largePage.has_more,true);
    const following=(await api.get('/api/flashcards/sync/changes').query({after:largePage.cursor}).auth(b.token,{type:'bearer'}).expect(200)).body.data;
    assert.equal(following.has_more,false);
    assert.equal([...largePage.events,...following.events].filter((x:any)=>x.id===large.id).length,2);
    await send([{...large,mutation_id:randomUUID(),cards:[{id:randomUUID(),front:face('x'.repeat(9*1024*1024)),back:face('too large')}]}],b,413);
    stage='restart-and-account-cascade';
    await app.close();app=null;
    const {FlashcardSyncService}=await import('../src/modules/flashcards/sync/flashcard-sync.service');
    assert.deepEqual((await new FlashcardSyncService(db).batch(a.id,[fa])).acknowledgements[0],ackA);
    await db.query('DELETE FROM users WHERE id=$1',[b.id]);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM flashcard_folders WHERE id=$1',[folderB]))[0].n,0);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM flashcard_sync_receipts WHERE user_id=$1',[b.id]))[0].n,0);
    assert.equal((await db.query('SELECT name FROM flashcard_folders WHERE id=$1',[legacy]))[0].name,'Unowned legacy');
    console.log('PASS Sprint06: legacy-preserving migration; actual JWT owner boundaries; atomic bulk validation; immutable receipts/dependencies; concurrent CAS; parent-delete conflicts; tombstones/deleted_ids; owner delta; legacy CRUD; no AI; durable replay; user cascade.');
  } finally {
    if(app)await app.close();
    if(created&&db.isInitialized){assert.match(schema,/^sprint06_test_[a-f0-9]{32}$/);await db.query('DROP SCHEMA "'+schema+'" CASCADE');}
    if(db.isInitialized)await db.destroy();
  }
}
run().catch((error:any)=>{console.error(JSON.stringify({result:'FAIL',stage,type:error.name,code:error.code,message:error.message,
  location:String(error.stack||'').split('\n').filter((line:string)=>line.trim().startsWith('at ')).slice(0,2)}));process.exitCode=1});
