/**
 * Isolated PostgreSQL + HTTP account integration check.
 * Never operates on the public schema; never contacts SMTP or Cloudinary.
 * Skips unless the configured database host is local.
 */
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { AppDataSource } from '../data-source';
import { LevelsModule } from '../src/modules/levels/levels.module';
import { TopicsModule } from '../src/modules/topics/topics.module';
import { AppConfigController } from '../src/app-config.controller';
import { VocabularySetsController } from '../src/modules/vocabulary-sets/vocabulary-sets.controller';
import { VocabularySetsService } from '../src/modules/vocabulary-sets/vocabulary-sets.service';
import { VocabularyItemsController } from '../src/modules/vocabulary-items/vocabulary-items.controller';
import { VocabularyItemsService } from '../src/modules/vocabulary-items/services/vocabulary-items.service';
import { GrammarPatternsController } from '../src/modules/grammar-patterns/grammar-patterns.controller';
import { GrammarPatternsService } from '../src/modules/grammar-patterns/services/grammar-patterns.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { AuthModule } from '../src/modules/auth/auth.module';
import { UsersModule } from '../src/modules/users/users.module';
import { EmailService } from '../src/modules/auth/services/email.service';
import { CloudinaryService } from '../src/modules/upload/cloudinary.service';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { SprintTwoAccounts1794614400000 } from '../src/database/migrations/1794614400000-SprintTwoAccounts';

let stage = 'preflight';

async function run() {
  const host = String((AppDataSource.options as any).host || 'localhost').toLowerCase();
  if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
    console.log('SKIPPED: isolated PostgreSQL integration requires a local database host. No database changes made.');
    return;
  }
  const schema = 'sprint03_test_' + randomUUID().replace(/-/g, '');
  // PostgreSQL 13+ provides gen_random_uuid() in pg_catalog; no shared extension or public search path is needed.
  const options: any = { ...AppDataSource.options, schema, synchronize: false, migrationsRun: false,
    uuidExtension: 'pgcrypto', installExtensions: false,
    logging: false, extra: { ...(AppDataSource.options as any).extra, options: '-c search_path=' + schema } };
  const database = new DataSource(options);
  let created = false;
  let app: any;
  try {
    try {
      await database.initialize();
      const [version] = await database.query("SELECT current_setting('server_version_num')::int AS version");
      if (version.version < 130000) {
        console.log('SKIPPED: isolated integration requires PostgreSQL 13+ core UUID generation.');
        return;
      }
      await database.query('CREATE SCHEMA "' + schema + '"');
      created = true;
    } catch {
      console.log('SKIPPED: local PostgreSQL is unavailable or cannot create an isolated test schema.');
      return;
    }
    const [scope] = await database.query('SELECT current_schema() AS name');
    assert.equal(scope.name, schema, 'Refusing to test outside the isolated schema');
    stage = 'schema-synchronization';
    await database.synchronize();
    // Exercise the migration against a legacy-shaped user in the isolated schema.
    await database.query('ALTER TABLE users DROP COLUMN email_verified_at, DROP COLUMN learning_settings');
    await database.query('ALTER TABLE verification_tokens DROP COLUMN attempt_count');
    const legacyId = randomUUID();
    await database.query('INSERT INTO users (id, username, email) VALUES ($1, $2, $3)',
      [legacyId, 'legacy-test', 'legacy@example.test']);
    stage = 'migration';
    const runner = database.createQueryRunner();
    const migration = new SprintTwoAccounts1794614400000();
    await migration.up(runner);
    const [legacy] = await database.query('SELECT email_verified_at, learning_settings FROM users WHERE id=$1', [legacyId]);
    assert.equal(legacy.email_verified_at, null);
    assert.deepEqual(legacy.learning_settings, {});
    await migration.down(runner);
    await migration.up(runner);
    await runner.release();

    const codes = new Map<string, string>();
    const resetCodes = new Map<string, string>();
    const deletedAvatars: string[] = [];
    stage = 'application-bootstrap';
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => ({
          jwt: { secret: 'isolated-test-access', refreshSecret: 'isolated-test-refresh', expiresIn: '15m', refreshExpiresIn: '7d' },
          bcrypt: { rounds: 4 },
        })] }),
        TypeOrmModule.forRoot(options), AuthModule, UsersModule, LevelsModule, TopicsModule,
      ],
      controllers: [AppConfigController, VocabularySetsController, VocabularyItemsController, GrammarPatternsController],
      providers: [
        { provide: VocabularySetsService, useValue: {} },
        { provide: VocabularyItemsService, useValue: {} },
        { provide: GrammarPatternsService, useValue: {} },
      ],
    }).overrideProvider(EmailService).useValue({
      sendEmailVerificationCode: async (email: string, code: string) => { codes.set(email, code); },
      sendPasswordResetCode: async (email: string, code: string) => { resetCodes.set(email, code); },
    }).overrideProvider(CloudinaryService).useValue({
      uploadAvatar: async (_file: unknown, userId: string) => ({ secure_url: 'https://images.example.test/' + userId + '.png', public_id: userId }),
      deleteAvatar: async (userId: string) => { deletedAvatars.push(userId); },
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    const api = request(app.getHttpServer());
    const email = 'sprint02@example.test';
    let password = 'password123';
    let username = 'sprint02user';
    stage = 'registration';
    const registered = await api.post('/api/auth/register').send({ username, email, password }).expect(201);
    const userId = registered.body.data.user.id;
    await api.post('/api/auth/login').send({ username, password }).expect(403);
    await api.post('/api/auth/verify-email').send({ email, code: '000000' }).expect(400);
    await api.post('/api/auth/verify-email').send({ email, code: codes.get(email) }).expect(200);
    await api.post('/api/auth/verify-email').send({ email, code: codes.get(email) }).expect(400);
    const loggedIn = await api.post('/api/auth/login').send({ username, password }).expect(200);
    let access = loggedIn.body.data.accessToken;
    let refresh = loggedIn.body.data.refreshToken;
    const bearer = () => 'Bearer ' + access;
    const catalogGet=(path:string)=>api.get(path).set('Authorization',bearer());
    const profile = await api.post('/api/auth/me').set('Authorization', bearer()).expect(200);
    assert.equal(profile.body.data.id, userId);
    assert.ok(Object.hasOwn(profile.body.data, 'avatar_url'));
    await api.get('/api/users/' + randomUUID()).set('Authorization', bearer()).expect(403);
    await api.patch('/api/users/me/profile').set('Authorization', bearer()).send({ role: 'admin' }).expect(400);
    username = 'sprint02updated';
    await api.patch('/api/users/me/profile').set('Authorization', bearer()).send({ username, full_name: 'Example Learner' }).expect(200);
    await api.patch('/api/users/me/settings').set('Authorization', bearer()).send({ daily_goal_minutes: 0 }).expect(400);
    await api.patch('/api/users/me/settings').set('Authorization', bearer())
      .send({ daily_goal_minutes: 30, timezone: 'Asia/Ho_Chi_Minh', reminder_time: '21:30' }).expect(200);
    const settings = await api.get('/api/users/me/settings').set('Authorization', bearer()).expect(200);
    assert.equal(settings.body.data.daily_goal_minutes, 30);
    await api.post('/api/users/me/avatar').set('Authorization', bearer())
      .attach('avatar', Buffer.from([137,80,78,71,13,10,26,10]), { filename: 'test.png', contentType: 'image/png' }).expect(200);

    stage = 'catalog-and-config';
    const title = { vi: 'Chào hỏi', en: 'Greetings', jp: '挨拶' };
    for (const code of ['N5','N4','N3','N2','N1'])
      await database.query('INSERT INTO levels (code,name) VALUES ($1,$2)', [code, title]);
    const topicId = randomUUID();
    await database.query('INSERT INTO topics (id,slug,level_code,title) VALUES ($1,$2,$3,$4)',
      [topicId, 'greetings', 'N5', title]);
    const setId = randomUUID();
    await database.query('INSERT INTO vocabulary_sets (id,topic_id,slug,title) VALUES ($1,$2,$3,$4)',
      [setId, topicId, 'greetings-set', title]);
    await database.query('INSERT INTO vocabulary_items (slug,topic_id,vocabulary_set_id,level_code,romaji,kana,meaning,word_type) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      ['hello',topicId,setId,'N5','konnichiwa','こんにちは',title,'expression']);
    await database.query('INSERT INTO grammar_sub_topics (slug,topic_id,level_code,title) VALUES ($1,$2,$3,$4)',
      ['greeting-grammar',topicId,'N5',title]);
    await database.query('INSERT INTO grammar_patterns (slug,grammar_sub_topic_slug,topic_slug,level_code,pattern_jp,explanation) VALUES ($1,$2,$3,$4,$5,$6)',
      ['desu','greeting-grammar','greetings','N5','です',title]);
    const levels = (await catalogGet('/api/levels').expect(200)).body.data;
    assert.deepEqual(levels.map((l:any)=>l.code), ['N5','N4','N3','N2','N1']);
    assert.equal(levels[0].topic_count, 1);
    assert.equal(levels[0].vocabulary_count, 1);
    assert.equal(levels[0].grammar_count, 1);
    assert.equal(levels[1].topic_count, 0);
    const missingLevel = await catalogGet('/api/levels/N9').expect(404);
    assert.match(missingLevel.headers['x-request-id'], /^[0-9a-f-]{36}$/);
    const topicsResponse = await catalogGet('/api/topics').expect(200);
    assert.match(topicsResponse.headers['x-request-id'], /^[0-9a-f-]{36}$/);
    const firstTopics = topicsResponse.body.data;
    const repeatedTopics = (await catalogGet('/api/topics').expect(200)).body.data;
    assert.equal(firstTopics[0].etag, repeatedTopics[0].etag);
    await catalogGet('/api/topics?levelCode=N9').expect(400);
    const bundle = (await catalogGet('/api/topics/greetings/bundle').expect(200)).body.data;
    const sameBundle = (await catalogGet('/api/topics/'+topicId+'/bundle').expect(200)).body.data;
    assert.equal(bundle.version, sameBundle.version);
    for (const field of ['vocabulary_sets','vocabulary_items','grammar_sub_topics','grammar_patterns'])
      assert.equal(bundle[field].length, 1);
    await database.query('UPDATE vocabulary_items SET kana=$1 WHERE slug=$2', ['こんばんは','hello']);
    const changedBundle = (await catalogGet('/api/topics/greetings/bundle').expect(200)).body.data;
    assert.notEqual(changedBundle.version, bundle.version);
    await catalogGet('/api/topics/missing/bundle').expect(404);
    const publicConfig = (await api.get('/api/app/config').expect(200)).body.data;
    assert.equal(publicConfig.schema_version, 1);
    assert.equal(typeof publicConfig.maintenance, 'boolean');
    for (const path of ['/api/topics', '/api/topics/seed', '/api/vocabulary-sets',
      '/api/vocabulary-items/generate', '/api/grammar-patterns/generate']) {
      await api.post(path).send({}).expect(401);
      await api.post(path).set('Authorization', bearer()).send({}).expect(403);
    }
    await database.query('UPDATE users SET role=$1 WHERE id=$2', ['admin',userId]);
    await api.post('/api/topics').set('Authorization', bearer()).send({
      slug:'admin-created',level_code:'N4',title
    }).expect(201);
    await database.query('UPDATE users SET role=$1 WHERE id=$2', ['user',userId]);

    stage = 'concurrent-refresh';
    const rotations = await Promise.all([
      api.post('/api/auth/refresh').send({ refreshToken: refresh }),
      api.post('/api/auth/refresh').send({ refreshToken: refresh }),
    ]);
    assert.deepEqual(rotations.map(result => result.status).sort(), [200, 401]);
    const winner = rotations.find(result => result.status === 200)!;
    access = winner.body.data.accessToken;
    refresh = winner.body.data.refreshToken;
    await api.post('/api/auth/logout').set('Authorization', bearer()).send({ refreshToken: refresh }).expect(200);
    await api.post('/api/auth/me').set('Authorization', bearer()).expect(401);
    stage = 'password-recovery';
    const extraSession = await app.get(AuthService).login({ username, password }, 'test', '127.0.0.1');
    await api.post('/api/auth/forgot-password').send({ email }).expect(200);
    const resetChallenge = await api.post('/api/auth/verify-reset-code').send({ email, code: resetCodes.get(email) }).expect(200);
    await api.post('/api/auth/me').set('Authorization', 'Bearer ' + resetChallenge.body.data.token).expect(401);
    password = 'updated-password123';
    const resetBody = { token: resetChallenge.body.data.token, password };
    await api.post('/api/auth/reset-password').send(resetBody).expect(200);
    await assert.rejects(() => app.get(AuthService).resetPassword(resetBody));
    await api.post('/api/auth/me').set('Authorization', 'Bearer ' + extraSession.accessToken).expect(401);
    const relogin = await api.post('/api/auth/login').send({ username, password }).expect(200);
    access = relogin.body.data.accessToken;
    await api.post('/api/auth/login').send({ username, password }).expect(429);
    stage = 'account-deletion';
    await api.delete('/api/users/' + userId).set('Authorization', bearer()).expect(204);
    assert.deepEqual(deletedAvatars, [userId]);
    await api.post('/api/auth/me').set('Authorization', bearer()).expect(401);
    const [deleted] = await database.query('SELECT count(*)::int AS count FROM users WHERE id=$1', [userId]);
    assert.equal(deleted.count, 0);
    console.log('PASS: Sprint 03 catalog counts/bundles/version changes/public config/Admin-write gates; isolated migration up/down, register/verify/login, full profile, ownership, preferences, avatar handoff, concurrent refresh, recovery/reuse rejection, request throttling, logout and deletion.');
  } finally {
    if (app) await app.close();
    if (created && database.isInitialized) {
      assert.match(schema, /^sprint03_test_[a-f0-9]{32}$/);
      await database.query('DROP SCHEMA "' + schema + '" CASCADE');
    }
    if (database.isInitialized) await database.destroy();
  }
}

run().catch((error: any) => {
  console.error('FAIL: isolated Sprint 03 integration; stage=' + stage + '; type=' + error.name + '; code=' + (error.code || 'none'));
  process.exitCode = 1;
});
