/**
 * Sprint 09 cross-feature ownership and role matrix.
 * One Nest app with every personal-data module; temporary local PostgreSQL schema; real JWT HTTP.
 * No real email, push, AI or storage provider calls. Read-only against shared data: none is touched.
 */
import 'reflect-metadata';
import assert from 'node:assert/strict';
import {randomUUID} from 'crypto';
import {DataSource} from 'typeorm';
import {Test} from '@nestjs/testing';
import {TypeOrmModule} from '@nestjs/typeorm';
import {ConfigModule} from '@nestjs/config';
import {ValidationPipe} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import request from 'supertest';
import {configureFlashcardBodies} from '../src/modules/flashcards/sync/flashcard-body-parser';
import {AppDataSource} from '../data-source';
import {AuthModule} from '../src/modules/auth/auth.module';
import {UsersModule} from '../src/modules/users/users.module';
import {AiModule} from '../src/modules/ai/ai.module';
import {PracticeModule} from '../src/modules/practice/practice.module';
import {FlashcardsModule} from '../src/modules/flashcards/flashcards.module';
import {FlashcardFoldersModule} from '../src/modules/flashcard-folders/flashcard-folders.module';
import {ProgressModule} from '../src/modules/progress/progress.module';
import {LearningStreaksModule} from '../src/modules/learning-streaks/learning-streaks.module';
import {NotificationsModule} from '../src/modules/notifications/notifications.module';
import {TopicsModule} from '../src/modules/topics/topics.module';
import {VocabularyItemsModule} from '../src/modules/vocabulary-items/vocabulary-items.module';
import {VocabularySetsModule} from '../src/modules/vocabulary-sets/vocabulary-sets.module';
import {GrammarPatternsModule} from '../src/modules/grammar-patterns/grammar-patterns.module';
import {AiGenerationService} from '../src/modules/ai/services/ai-generation.service';
import {FcmProvider} from '../src/modules/notifications/fcm.provider';
import {EmailService} from '../src/modules/auth/services/email.service';
import {ResponseInterceptor} from '../src/common/interceptors/response.interceptor';
import {GlobalExceptionFilter} from '../src/common/filters/global-exception.filter';

let stage = 'preflight';
async function run() {
  assert.ok(['localhost', '127.0.0.1', '::1'].includes(String((AppDataSource.options as any).host).toLowerCase()));
  const schema = 'sprint09_test_' + randomUUID().replace(/-/g, '');
  const options: any = {
    ...AppDataSource.options, schema, synchronize: false, migrationsRun: false, uuidExtension: 'pgcrypto',
    installExtensions: false, logging: false,
    extra: {...(AppDataSource.options as any).extra, options: '-c search_path=' + schema},
  };
  const db = new DataSource(options);
  let created = false, app: any;
  try {
    await db.initialize();
    await db.query('CREATE SCHEMA "' + schema + '"');
    created = true;
    await db.synchronize();
    const codes = new Map<string, string>();
    const module = await Test.createTestingModule({imports: [
      ConfigModule.forRoot({isGlobal: true, ignoreEnvFile: true, load: [() => ({
        jwt: {secret: 'sprint09-access', refreshSecret: 'sprint09-refresh', expiresIn: '15m', refreshExpiresIn: '7d'},
        bcrypt: {rounds: 4}, ai: {apiKey: 'fixture-key-never-sent'},
      })]}),
      TypeOrmModule.forRoot(options),
      AuthModule, UsersModule, AiModule, PracticeModule, FlashcardsModule, FlashcardFoldersModule, ProgressModule,
      LearningStreaksModule, NotificationsModule, TopicsModule, VocabularyItemsModule, VocabularySetsModule, GrammarPatternsModule,
    ]})
      .overrideProvider(AiGenerationService).useValue({generateWithRetry: async () => ({content: JSON.stringify({exercises: [{
        type: 'fill_blank', question: {text: 'これは____です。'}, correct_answer: '猫', explanation: {en: 'Cat', vi: 'Mèo'},
      }]})})})
      .overrideProvider(FcmProvider).useValue({configured: () => true, send: async () => 'sent'})
      .overrideProvider(EmailService).useValue({sendEmailVerificationCode: async (email: string, code: string) => codes.set(email, code)})
      .compile();
    app = module.createNestApplication();
    configureFlashcardBodies(app);
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({whitelist: true, forbidNonWhitelisted: true, transform: true}));
    app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    const api = request(app.getHttpServer());

    const login = async (name: string) => {
      const email = name + '@example.test', password = 'password123';
      const registration = await api.post('/api/auth/register').send({username: name, email, password}).expect(201);
      await api.post('/api/auth/verify-email').send({email, code: codes.get(email)}).expect(200);
      const result = await api.post('/api/auth/login').send({username: name, password}).expect(200);
      return {
        id: registration.body.data.user.id as string, name, password, refresh: result.body.data.refreshToken as string,
        token: (result.body.data.accessToken || result.body.data.access_token) as string,
      };
    };
    const a = await login('s09a'), b = await login('s09b');
    const adminSeed = await login('s09admin');
    await db.query("UPDATE users SET role='admin' WHERE id=$1", [adminSeed.id]);
    const adminLogin = await api.post('/api/auth/login').send({username: adminSeed.name, password: adminSeed.password}).expect(200);
    const admin = {...adminSeed, token: (adminLogin.body.data.accessToken || adminLogin.body.data.access_token) as string};
    const bearer = (u: {token: string}) => ({token: u.token, type: 'bearer' as const});
    const as = (method: 'get' | 'post' | 'put' | 'patch' | 'delete', path: string, u?: {token: string; id?: string}) => {
      let r = (api as any)[method](path);
      if (u) r = r.auth(u.token, {type: 'bearer'});
      return r;
    };

    // ---- Seed user A's private data across features ----
    stage = 'seed-owner-data';
    const folderA = randomUUID(), setA = randomUUID(), cardA = randomUUID();
    const face = (text: string) => ({text, type: 'text'});
    const op = (kind: string, id: string, extra: any = {}) => ({mutation_id: randomUUID(), kind, id, action: 'upsert', base_version: '0', ...extra});
    const flashSend = async (mutations: any[]) => (await api.post('/api/flashcards/sync/batch').auth(a.token, {type: 'bearer'})
      .set('X-Nihonix-Account', a.id).send({mutations}).expect(200)).body.data;
    assert.equal((await flashSend([op('folder', folderA, {name: 'Private A'})])).acknowledgements[0].status, 'accepted');
    assert.equal((await flashSend([op('set', setA, {folder_id: folderA, name: 'Set A', cards: [{id: cardA, front: face('A'), back: face('a'), order: 1}]})])).acknowledgements[0].status, 'accepted');

    const mutation = {mutation_id: randomUUID(), item_type: 'vocabulary', item_id: 'hello', status: 'learned', client_updated_at: new Date().toISOString()};
    await api.post('/api/progress/batch').auth(a.token, {type: 'bearer'}).send({mutations: [mutation]}).expect(200);

    const event = {id: randomUUID(), activity_type: 'vocabulary', duration_seconds: 60, occurred_at: new Date(Date.now() - 120000).toISOString(), timezone: 'Asia/Ho_Chi_Minh'};
    await api.post('/api/learning-streaks/activities/batch').auth(a.token, {type: 'bearer'}).set('X-Nihonix-Account', a.id).send({events: [event]}).expect(200);

    const topic = randomUUID();
    await db.query("INSERT INTO levels(code,name) VALUES('N5',$1)", [{en: 'N5', vi: 'N5', jp: 'N5'}]);
    await db.query("INSERT INTO topics(id,slug,level_code,title) VALUES($1,'s09-topic','N5',$2)", [topic, {en: 'T', vi: 'T', jp: 'T'}]);
    await db.query("INSERT INTO vocabulary_items(slug,topic_id,level_code,romaji,kana,meaning,word_type) VALUES('s09-neko',$1,'N5','neko','ねこ',$2,'noun')", [topic, {en: 'cat', vi: 'mèo', jp: '猫'}]);
    const requestA = randomUUID();
    const practiceA = (await api.post('/api/practice/fill-blank').auth(a.token, {type: 'bearer'}).send({request_id: requestA, topic_id: topic, exercise_count: 1}).expect(201)).body.data.result;

    const installation = randomUUID();
    await api.put('/api/devices/' + installation).auth(a.token, {type: 'bearer'}).set('X-Nihonix-Account', a.id).send({token: 'a-device-token-1234567890', enabled: true}).expect(200);

    // ---- 1. Every personal route rejects anonymous callers ----
    stage = 'anonymous-rejected';
    const personal: Array<[string, string]> = [
      ['get', '/api/flashcard-folders'], ['get', '/api/flashcards/sets'], ['get', '/api/flashcards/sync/changes'],
      ['post', '/api/flashcards/sync/batch'], ['get', '/api/progress/summary'], ['get', '/api/progress/changes'],
      ['post', '/api/progress/batch'], ['get', '/api/practice/sets'], ['get', '/api/practice/sets/' + practiceA.id],
      ['post', '/api/practice/submit'], ['get', '/api/ai/quota'], ['get', '/api/ai/requests/' + requestA],
      ['post', '/api/ai/requests/' + requestA + '/cancel'], ['get', '/api/learning-streaks'],
      ['get', '/api/learning-streaks/calendar'], ['post', '/api/learning-streaks/activities/batch'],
      ['put', '/api/devices/' + installation], ['delete', '/api/devices/' + installation],
      ['get', '/api/users'], ['get', '/api/users/' + a.id], ['put', '/api/users/' + a.id], ['delete', '/api/users/' + a.id],
      ['get', '/api/users/me/settings'], ['patch', '/api/users/me/settings'], ['get', '/api/users/me/level'],
    ];
    for (const [method, path] of personal) {
      const res = await as(method as any, path);
      assert.equal(res.status, 401, `anonymous ${method.toUpperCase()} ${path} returned ${res.status}`);
    }

    // ---- 2. User B cannot see or change user A's data ----
    stage = 'cross-user-isolation';
    for (const path of ['/api/flashcard-folders/' + folderA, '/api/flashcards/sets/' + setA + '/cards']) {
      assert.equal((await as('get', path, b)).status, 404, 'B read A flashcards ' + path);
    }
    assert.equal((await as('put', '/api/flashcard-folders/' + folderA, b).send({name: 'Stolen'})).status, 404);
    assert.equal((await as('delete', '/api/flashcard-folders/' + folderA, b)).status, 404);
    assert.equal((await as('delete', '/api/flashcards/sets/' + setA, b)).status, 404);
    assert.equal((await as('get', '/api/flashcard-folders', b).expect(200)).body.data.length, 0);
    assert.equal((await as('get', '/api/progress/changes', b).expect(200)).body.data.events.length, 0);
    assert.equal((await as('get', '/api/practice/sets/' + practiceA.id, b)).status, 404);
    assert.equal((await as('get', '/api/ai/requests/' + requestA, b)).status, 404);
    assert.equal((await as('post', '/api/ai/requests/' + requestA + '/cancel', b)).status, 404);
    const summaryB = (await as('get', '/api/learning-streaks', b).expect(200)).body.data;
    assert.equal(summaryB.today_seconds, 0);
    assert.equal(summaryB.current_streak, 0);
    const submitForeign = await as('post', '/api/practice/submit', b).send({request_id: randomUUID(), session_id: practiceA.id, answers: [{exercise_id: practiceA.exercises[0].id, user_answer: '猫'}]});
    assert.ok([403, 404].includes(submitForeign.status), 'B submitted A practice: ' + submitForeign.status);
    const practiceStatus = (await db.query('SELECT status FROM practice_sessions WHERE id=$1', [practiceA.id]))[0].status;
    assert.notEqual(practiceStatus, 'completed', 'A practice session was completed by B');

    // Account header pinning: B's token cannot act as A.
    assert.equal((await api.post('/api/learning-streaks/activities/batch').auth(b.token, {type: 'bearer'}).set('X-Nihonix-Account', a.id).send({events: [{...event, id: randomUUID()}]})).status, 409);
    assert.equal((await api.post('/api/progress/batch').auth(b.token, {type: 'bearer'}).set('X-Nihonix-Account', a.id).send({mutations: [{...mutation, mutation_id: randomUUID()}]})).status, 409);

    // Device binding: B cannot remove A's device registration by installation id.
    const deviceBefore = (await db.query('SELECT user_id FROM notification_devices WHERE installation_id=$1', [installation]))[0];
    await as('delete', '/api/devices/' + installation, b);
    const deviceAfter = (await db.query('SELECT user_id FROM notification_devices WHERE installation_id=$1', [installation]))[0];
    assert.equal(deviceAfter?.user_id, deviceBefore.user_id, 'B removed A device binding');

    // ---- 3. Users controller: self vs other vs admin ----
    stage = 'users-roles';
    assert.equal((await as('get', '/api/users/' + a.id, a)).status, 200);
    assert.equal((await as('get', '/api/users/' + a.id, b)).status, 403);
    assert.equal((await as('put', '/api/users/' + a.id, b).send({full_name: 'Hijack'})).status, 403);
    assert.equal((await as('delete', '/api/users/' + a.id, b)).status, 403);
    assert.equal((await as('get', '/api/users', b)).status, 403);
    assert.equal((await as('get', '/api/users', a)).status, 403);
    assert.equal((await as('get', '/api/users', admin)).status, 200);
    assert.equal((await as('get', '/api/users/' + a.id, admin)).status, 200);
    const selfEmail = await as('put', '/api/users/' + a.id, a).send({email: 'changed@example.test'});
    assert.ok([400, 403].includes(selfEmail.status), 'user changed own email via PUT: ' + selfEmail.status);
    assert.equal((await db.query('SELECT email FROM users WHERE id=$1', [a.id]))[0].email, 's09a@example.test');
    const selfStatus = await as('put', '/api/users/' + a.id, a).send({status: 'inactive'});
    assert.ok([400, 403].includes(selfStatus.status), 'user changed own status via PUT: ' + selfStatus.status);
    const selfRole = await as('put', '/api/users/' + a.id, a).send({role: 'admin'});
    assert.ok([400, 403].includes(selfRole.status), 'user escalated role via PUT: ' + selfRole.status);
    assert.equal((await db.query('SELECT role FROM users WHERE id=$1', [a.id]))[0].role, 'user');

    // ---- 4. Catalog write routes: admin only ----
    stage = 'admin-only-catalog-writes';
    const writes: Array<[string, string]> = [
      ['post', '/api/topics'], ['post', '/api/topics/seed'], ['post', '/api/vocabulary-sets'],
      ['post', '/api/vocabulary-items/generate'], ['post', '/api/grammar-patterns/generate'],
    ];
    for (const [method, path] of writes) {
      const userRes = await as(method as any, path, a).send({});
      assert.equal(userRes.status, 403, `non-admin ${method.toUpperCase()} ${path} returned ${userRes.status}`);
      const adminRes = await as(method as any, path, admin).send({});
      assert.ok(![401, 403].includes(adminRes.status), `admin blocked on ${method.toUpperCase()} ${path}: ${adminRes.status}`);
    }

    // ---- 5. Token replay and revocation ----
    stage = 'token-replay';
    // Reuse B's first login: repeated logins from one address hit the credential throttle (429), which is intended.
    const refresh = b.refresh;
    assert.ok(refresh, 'login returned no refresh token');
    const rotated = (await api.post('/api/auth/refresh').send({refreshToken: refresh}).expect(200)).body.data;
    assert.equal((await api.post('/api/auth/refresh').send({refreshToken: refresh})).status, 401, 'refresh token replay accepted');
    await api.post('/api/auth/logout').auth(rotated.accessToken, {type: 'bearer'}).send({refreshToken: rotated.refreshToken}).expect(200);
    assert.equal((await api.get('/api/learning-streaks').auth(rotated.accessToken, {type: 'bearer'})).status, 401, 'access token valid after logout');
    assert.equal((await api.post('/api/auth/refresh').send({refreshToken: rotated.refreshToken})).status, 401, 'refresh token valid after logout');
    assert.equal((await api.get('/api/learning-streaks').set('Authorization', 'Bearer not.a.jwt')).status, 401);

    // ---- 6. Deletion removes the owner's data from every feature ----
    stage = 'account-deletion-cascade';
    await as('delete', '/api/users/' + a.id, a).expect(204);
    const owned = ['flashcard_folders', 'flashcard_sets', 'learning_activity_events', 'notification_devices', 'practice_sessions'];
    let checked = 0;
    for (const table of owned) {
      const exists = (await db.query("SELECT to_regclass($1) AS t", [schema + '.' + table]))[0].t;
      if (!exists) continue;
      const column = (await db.query("SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2 AND column_name IN ('user_id','owner_id') LIMIT 1", [schema, table]))[0]?.column_name;
      if (!column) continue;
      const left = (await db.query(`SELECT count(*)::int AS n FROM "${table}" WHERE "${column}"=$1`, [a.id]))[0].n;
      assert.equal(left, 0, `${table} still has rows for deleted user`);
      checked++;
    }
    assert.ok(checked >= 4, 'cascade check was vacuous: only ' + checked + ' tables inspected');
    assert.equal((await as('get', '/api/learning-streaks', a)).status, 401, 'deleted user token still accepted');

    console.log('PASS Sprint09 ownership/role matrix: anonymous 401, cross-user 404/403/409, users self/admin, catalog admin-only, token replay/revocation, deletion cascade; no real providers.');
  } finally {
    if (app) await app.close();
    if (created && db.isInitialized) {
      assert.match(schema, /^sprint09_test_[a-f0-9]{32}$/);
      await db.query('DROP SCHEMA "' + schema + '" CASCADE');
    }
    if (db.isInitialized) await db.destroy();
  }
}
run().catch(error => {
  console.error('FAIL Sprint09 at stage ' + stage + ':', error?.message || error);
  process.exit(1);
});
