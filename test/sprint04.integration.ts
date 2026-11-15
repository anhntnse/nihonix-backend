/**
 * Real PostgreSQL/HTTP catalog tests. Creates and drops only its unique local
 * schema. Does not seed shared data, call AI, SMTP or media providers.
 */
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { AppDataSource } from '../data-source';
import { LearningContentModule } from '../src/modules/learning-content/learning-content.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';

let stage='preflight';
async function run() {
  const host=String((AppDataSource.options as any).host || 'localhost').toLowerCase();
  assert.ok(['localhost','127.0.0.1','::1'].includes(host),'Requires local PostgreSQL');
  const schema='sprint04_test_'+randomUUID().replace(/-/g,'');
  const options:any={...AppDataSource.options,schema,synchronize:false,migrationsRun:false,
    uuidExtension:'pgcrypto',installExtensions:false,logging:false,
    extra:{...(AppDataSource.options as any).extra,options:'-c search_path='+schema}};
  const db=new DataSource(options);
  let created=false; let app:any;
  try {
    await db.initialize();
    await db.query('CREATE SCHEMA "'+schema+'"'); created=true;
    assert.equal((await db.query('SELECT current_schema() AS name'))[0].name,schema);
    await db.synchronize();
    stage='fixtures';
    const text={vi:'Chào hỏi',en:'Greetings',jp:'挨拶'};
    const topic=randomUUID(),other=randomUUID(),set=randomUUID(),otherSet=randomUUID();
    for(const code of ['N5','N4','N3','N2','N1']) await db.query('INSERT INTO levels(code,name) VALUES($1,$2)',[code,text]);
    await db.query('INSERT INTO topics(id,slug,level_code,title) VALUES($1,$2,$3,$4),($5,$6,$7,$8)',
      [topic,'greetings','N5',text,other,'advanced','N3',text]);
    await db.query('INSERT INTO vocabulary_sets(id,topic_id,slug,title) VALUES($1,$2,$3,$4),($5,$6,$7,$8)',
      [set,topic,'greeting-set',text,otherSet,other,'advanced-set',text]);
    const examples=[{sentence_jp:'こんにちは',sentence_romaji:'Konnichiwa',sentence_vi:'Xin chào',sentence_en:'Hello'}];
    for(let i=0;i<25;i++) {
      const own=i<22;
      await db.query('INSERT INTO vocabulary_items(slug,topic_id,vocabulary_set_id,level_code,romaji,kana,kanji,meaning,word_type,examples) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
        ['word-'+String(i).padStart(3,'0'),own?topic:other,own?set:otherSet,own?'N5':'N3',i===0?'literal_%':'reading-'+i,
          'こんにちは',i===0?'日本':null,{vi:'Xin chào',en:'Hello',jp:'こんにちは'},'noun',JSON.stringify(examples)]);
    }
    await db.query('INSERT INTO grammar_sub_topics(slug,topic_id,level_code,title) VALUES($1,$2,$3,$4),($5,$6,$7,$8)',
      ['basic',topic,'N5',text,'advanced-grammar',other,'N3',text]);
    for(let i=0;i<23;i++) {
      const own=i<21;
      await db.query('INSERT INTO grammar_patterns(slug,grammar_sub_topic_slug,topic_slug,level_code,pattern_jp,pattern_romaji,explanation,usage_examples,conjugation_rules,grammar_points) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
        ['pattern-'+String(i).padStart(3,'0'),own?'basic':'advanced-grammar',own?'greetings':'advanced',own?'N5':'N3','です','desu',
          {vi:'Lịch sự',en:'Polite ending',jp:'丁寧'},JSON.stringify(examples),{present:'です'},JSON.stringify(['polite','present'])]);
    }
    const module=await Test.createTestingModule({imports:[TypeOrmModule.forRoot(options),LearningContentModule]}).compile();
    app=module.createNestApplication(); app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({whitelist:true,forbidNonWhitelisted:true,transform:true}));
    app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
    app.useGlobalFilters(new GlobalExceptionFilter()); await app.init();
    const api=request(app.getHttpServer());
    const list=async(kind:string,query:any={}) => (await api.get('/api/catalog/'+kind).query(query).expect(200)).body.data;
    stage='paging';
    const first=await list('vocabulary-items',{topic_id:topic});
    const second=await list('vocabulary-items',{topic_id:topic,page:2});
    assert.equal(first.total,22); assert.equal(first.items.length,20); assert.equal(first.has_more,true);
    assert.equal(second.items.length,2); assert.equal(second.has_more,false);
    const keys=[...first.items,...second.items].map((item:any)=>item.slug);
    assert.equal(new Set(keys).size,22); assert.deepEqual(keys,[...keys].sort());
    assert.equal(first.version,(await list('vocabulary-items',{topic_id:topic})).version);
    const beyond=await list('vocabulary-items',{topic_id:topic,page:3}); assert.equal(beyond.items.length,0);
    stage='filters-search';
    assert.equal((await list('vocabulary-items',{level_code:'N3'})).total,3);
    assert.equal((await list('vocabulary-items',{set_id:set})).total,22);
    assert.equal((await list('vocabulary-items',{q:'日本'})).total,1);
    assert.equal((await list('vocabulary-items',{q:'HELLO'})).total,25);
    assert.equal((await list('vocabulary-items',{q:'xin chào'})).total,25);
    assert.equal((await list('vocabulary-items',{q:'%'})).total,1);
    assert.equal((await list('vocabulary-items',{q:'_'})).total,1);
    assert.equal((await list('vocabulary-items',{q:"%' OR 1=1 --"})).total,0);
    assert.equal((await list('vocabulary-sets',{level_code:'N5'})).items[0].items_count,22);
    assert.equal((await list('grammar-sub-topics',{topic_id:topic})).items[0].items_count,21);
    assert.equal((await list('grammar-patterns',{sub_topic_slug:'basic'})).total,21);
    assert.equal((await list('grammar-patterns',{q:'Lịch sự',level_code:'N3'})).total,2);
    stage='details-version';
    const word=(await api.get('/api/catalog/vocabulary-items/word-000').expect(200)).body.data;
    assert.equal(word.examples[0].sentence_jp,'こんにちは'); assert.equal(word.topic.id,topic);
    const group=(await api.get('/api/catalog/vocabulary-sets/'+set).expect(200)).body.data;
    assert.equal(group.items_count,22); assert.equal(group.items,undefined);
    const grammar=(await api.get('/api/catalog/grammar-patterns/pattern-000').expect(200)).body.data;
    assert.equal(grammar.conjugation_rules.present,'です'); assert.equal(grammar.usage_examples.length,1);
    await api.get('/api/catalog/grammar-sub-topics/basic').expect(200);
    await db.query('UPDATE vocabulary_items SET kana=$1 WHERE slug=$2',['こんばんは','word-000']);
    assert.notEqual(first.version,(await list('vocabulary-items',{topic_id:topic})).version);
    stage='validation';
    for(const query of [{page:0},{page_size:101},{page:1.5},{level_code:'N9'},{topic_id:'bad'},{set_id:'bad'},{q:'x'.repeat(121)},{unknown:'field'}])
      await api.get('/api/catalog/vocabulary-items').query(query).expect(400);
    await api.get('/api/catalog/vocabulary-items').query({topic_id:randomUUID()}).expect(404);
    await api.get('/api/catalog/vocabulary-items').query({set_id:randomUUID()}).expect(404);
    await api.get('/api/catalog/grammar-patterns').query({sub_topic_slug:'missing'}).expect(404);
    await api.get('/api/catalog/grammar-patterns').query({set_id:set}).expect(400);
    await api.get('/api/catalog/vocabulary-sets/bad-uuid').expect(400);
    await api.get('/api/catalog/vocabulary-items/missing').expect(404);
    await api.get('/api/catalog/unknown').expect(404);
    assert.equal((await list('vocabulary-items',{level_code:'N1'})).items.length,0);
    console.log('PASS: Sprint 04 paging without gaps/duplicates, topic/level/parent filters, literal multilingual search, rich details, stable/changing versions, empty/missing/invalid data.');
  } finally {
    if(app) await app.close();
    if(created && db.isInitialized) {
      assert.match(schema,/^sprint04_test_[a-f0-9]{32}$/);
      await db.query('DROP SCHEMA "'+schema+'" CASCADE');
    }
    if(db.isInitialized) await db.destroy();
  }
}
run().catch((error:any)=>{console.error(JSON.stringify({result:'FAIL',stage,type:error.name,code:error.code,
  location:String(error.stack||'').split('\n').filter((l:string)=>l.trim().startsWith('at ')).slice(0,2)}));process.exitCode=1;});
