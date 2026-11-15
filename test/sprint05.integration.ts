/** Local isolated PostgreSQL schema; no SMTP, AI or shared-schema writes. */
import 'reflect-metadata';
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
import {EntitySyncModule} from '../src/modules/entity-sync/entity-sync.module';
import {ProgressModule} from '../src/modules/progress/progress.module';
import {LearningContentModule} from '../src/modules/learning-content/learning-content.module';
import {ResponseInterceptor} from '../src/common/interceptors/response.interceptor';
import {GlobalExceptionFilter} from '../src/common/filters/global-exception.filter';
import {OfflineProgress1794700000000} from '../src/database/migrations/1794700000000-OfflineProgress';

let stage='preflight';
async function run() {
  assert.ok(['localhost','127.0.0.1','::1'].includes(String((AppDataSource.options as any).host).toLowerCase()),'Local PostgreSQL required');
  const schema='sprint05_test_'+randomUUID().replace(/-/g,'');
  const options:any={...AppDataSource.options,schema,synchronize:false,migrationsRun:false,uuidExtension:'pgcrypto',installExtensions:false,logging:false,
    extra:{...(AppDataSource.options as any).extra,options:'-c search_path='+schema}};
  const db=new DataSource(options);let created=false;let app:any;
  try {
    await db.initialize();await db.query('CREATE SCHEMA "'+schema+'"');created=true;
    assert.equal((await db.query('SELECT current_schema() AS name'))[0].name,schema);
    await db.synchronize();
    const runner=db.createQueryRunner();const migration=new OfflineProgress1794700000000();
    await migration.down(runner);await migration.up(runner);await migration.down(runner);await migration.up(runner);await runner.release();
    stage='fixtures';
    const text={en:'Greetings',vi:'Chào hỏi',jp:'挨拶'};const topic=randomUUID();
    await db.query('INSERT INTO levels(code,name) VALUES($1,$2)',['N5',text]);
    await db.query('INSERT INTO topics(id,slug,level_code,title) VALUES($1,$2,$3,$4)',[topic,'greetings','N5',text]);
    await db.query('INSERT INTO vocabulary_items(slug,topic_id,level_code,kana,romaji,meaning,word_type) VALUES($1,$2,$3,$4,$5,$6,$7)',
      ['hello',topic,'N5','こんにちは','konnichiwa',text,'noun']);
    await db.query('INSERT INTO grammar_sub_topics(slug,topic_id,level_code,title) VALUES($1,$2,$3,$4)',['basic',topic,'N5',text]);
    await db.query('INSERT INTO grammar_patterns(slug,grammar_sub_topic_slug,topic_slug,level_code,pattern_jp,explanation) VALUES($1,$2,$3,$4,$5,$6)',
      ['desu','basic','greetings','N5','です',text]);
    const codes=new Map<string,string>();
    const module=await Test.createTestingModule({imports:[
      ConfigModule.forRoot({isGlobal:true,ignoreEnvFile:true,load:[()=>({jwt:{secret:'sprint05-access',refreshSecret:'sprint05-refresh',expiresIn:'15m',refreshExpiresIn:'7d'},bcrypt:{rounds:4}})]}),
      TypeOrmModule.forRoot(options),AuthModule,ProgressModule,LearningContentModule,EntitySyncModule
    ]}).overrideProvider(EmailService).useValue({sendEmailVerificationCode:async(email:string,code:string)=>{codes.set(email,code)}}).compile();
    app=module.createNestApplication();app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({whitelist:true,forbidNonWhitelisted:true,transform:true}));
    app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));app.useGlobalFilters(new GlobalExceptionFilter());await app.init();
    const api=request(app.getHttpServer());
    const login=async(name:string)=>{
      const email=name+'@example.test';const password='password123';
      const registration=await api.post('/api/auth/register').send({username:name,email,password}).expect(201);
      await api.post('/api/auth/verify-email').send({email,code:codes.get(email)}).expect(200);
      const result=await api.post('/api/auth/login').send({username:name,password}).expect(200);
      return {token:result.body.data.access_token || result.body.data.accessToken,id:registration.body.data.user.id};
    };
    stage='authentication';const a=await login('sprint05a');const b=await login('sprint05b');assert.ok(a.token);
    await api.post('/api/progress/batch').send({mutations:[]}).expect(401);
    const send=async(mutations:any[],token=a.token,code=200)=>(await api.post('/api/progress/batch').auth(token,{type:'bearer'}).send({mutations}).expect(code)).body.data;
    const now=Date.now()-10000;
    const mutation={mutation_id:randomUUID(),item_type:'vocabulary',item_id:'hello',status:'learned',client_updated_at:new Date(now).toISOString()};
    stage='idempotency';const first=await send([mutation]);assert.equal(first.acknowledgements[0].status,'accepted');
    assert.deepEqual(await send([mutation]),first);
    await send([{...mutation,status:'not_learned'}],a.token,409);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM progress_receipts WHERE user_id=$1',[a.id]))[0].n,1);
    stage='ownership-validation';
    await api.post('/api/progress/batch').auth(b.token,{type:'bearer'}).set('X-Nihonix-Account',a.id).send({mutations:[mutation]}).expect(409);
    await api.post('/api/progress/batch').auth(a.token,{type:'bearer'}).send({user_id:b.id,mutations:[mutation]}).expect(400);
    await send([],a.token,400);
    const privateDelta=await api.get('/api/progress/changes').auth(b.token,{type:'bearer'}).expect(200);assert.equal(privateDelta.body.data.events.length,0);
    stage='conflicts';
    const stale={...mutation,mutation_id:randomUUID(),status:'not_learned',client_updated_at:new Date(now-1000).toISOString()};
    assert.equal((await send([stale])).acknowledgements[0].status,'stale');
    const small={...mutation,mutation_id:'00000000-0000-4000-8000-000000000001',status:'not_learned',client_updated_at:new Date(now+1000).toISOString()};
    const large={...small,mutation_id:'ffffffff-ffff-4fff-8fff-ffffffffffff',status:'learned'};
    await Promise.all([send([large]),send([small])]);
    assert.equal((await db.query('SELECT status FROM learning_progress WHERE user_id=$1',[a.id]))[0].status,'learned');
    const grammar={...mutation,item_type:'grammar',item_id:'desu',mutation_id:randomUUID()};
    const invalid={...mutation,item_id:'deleted',mutation_id:randomUUID()};
    const future={...mutation,mutation_id:randomUUID(),client_updated_at:new Date(Date.now()+10*60000).toISOString()};
    const mixed=await send([grammar,invalid,future]);assert.deepEqual(mixed.acknowledgements.map((x:any)=>x.status),['accepted','rejected','rejected']);
    stage='delta-summary';let cursor='0';const versions:string[]=[];
    for(let i=0;i<20;i++) {
      const data=(await api.get('/api/progress/changes').query({after:cursor,limit:2}).auth(a.token,{type:'bearer'}).expect(200)).body.data;
      versions.push(...data.events.map((x:any)=>x.version));cursor=data.cursor;if(!data.has_more)break;
    }
    assert.equal(versions.length,7);assert.equal(new Set(versions).size,7);
    const summary=async()=>(await api.get('/api/progress/summary').auth(a.token,{type:'bearer'}).expect(200)).body.data;
    assert.deepEqual((await summary()).levels,[{level_code:'N5',learned:2,total:2}]);
    stage='legacy-entity-sync';
    const legacy=await api.get('/api/entity-sync/level/N5').timeout({response:2000,deadline:5000}).expect(200);
    assert.equal(legacy.body.data.code,'N5');assert.ok(legacy.headers.etag);
    assert.equal((await api.get('/api/entity-sync/level/N5').expect(200)).headers.etag,legacy.headers.etag);
    await api.get('/api/entity-sync/level/N5').set('If-None-Match',legacy.headers.etag).expect(304);
    stage='conditional-manifest';
    const manifest=await api.get('/api/catalog/manifest').expect(200);assert.equal(manifest.body.data.collections.length,6);
    assert.equal((await api.get('/api/catalog/manifest').set('If-None-Match',manifest.headers.etag).expect(304)).text,'');
    const detail=await api.get('/api/catalog/vocabulary-items/hello').expect(200);
    await api.get('/api/catalog/vocabulary-items/hello').set('If-None-Match','W/'+detail.headers.etag).expect(304);
    await db.query('UPDATE vocabulary_items SET kana=$1 WHERE slug=$2',['こんばんは','hello']);
    const changed=await api.get('/api/catalog/vocabulary-items/hello').set('If-None-Match',detail.headers.etag).expect(200);
    assert.notEqual(changed.headers.etag,detail.headers.etag);
    await db.query('DELETE FROM vocabulary_items WHERE slug=$1',['hello']);
    const deleted=await api.get('/api/catalog/manifest').expect(200);
    assert.notEqual(deleted.headers.etag,manifest.headers.etag);
    assert.equal(deleted.body.data.collections.find((x:any)=>x.kind==='vocabulary-items').entries.length,0);
    assert.deepEqual((await summary()).levels,[{level_code:'N5',learned:1,total:1}]);
    stage='restart-and-receipt';
    await app.close();app=null;
    const {ProgressService}=await import('../src/modules/progress/progress.service');
    assert.deepEqual(await new ProgressService(db).batch(a.id,{mutations:[mutation]}),first);
    await db.query('DELETE FROM users WHERE id=$1',[a.id]);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM progress_receipts WHERE user_id=$1',[a.id]))[0].n,0);
    console.log('PASS Sprint05: migrations, real JWT ownership, durable receipts, duplicate replay, conflicts/concurrency, partial rejections, delta paging, summary, HTTP304, updated/deleted manifest, service restart, account cascade.');
  } finally {
    if(app)await app.close();
    if(created&&db.isInitialized){assert.match(schema,/^sprint05_test_[a-f0-9]{32}$/);await db.query('DROP SCHEMA "'+schema+'" CASCADE');}
    if(db.isInitialized)await db.destroy();
  }
}
run().catch((error:any)=>{console.error(JSON.stringify({result:'FAIL',stage,type:error.name,code:error.code,message:error.message,
  location:String(error.stack||'').split('\n').filter((l:string)=>l.trim().startsWith('at ')).slice(0,2)}));process.exitCode=1});
