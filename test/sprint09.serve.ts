/**
 * Sprint 09 local acceptance server (NOT for shared use).
 * Serves the full API on PORT (default 3099) from the temporary PostgreSQL schema `sprint09_serve` on localhost,
 * with fake email (codes written to %TEMP%/s09-codes.json), fake FCM and fake AI. No real provider is called and
 * the development schema is not touched. Stop by creating %TEMP%/s09-stop (schema is dropped on stop).
 * Run `ts-node ... test/sprint09.serve.ts --cleanup` to drop the schema if the process was killed.
 */
import 'reflect-metadata';
import assert from 'node:assert/strict';
import {existsSync, readFileSync, writeFileSync, unlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DataSource} from 'typeorm';
import {Test} from '@nestjs/testing';
import {TypeOrmModule} from '@nestjs/typeorm';
import {ConfigModule} from '@nestjs/config';
import {Module, ValidationPipe} from '@nestjs/common';
import {Reflector} from '@nestjs/core';
import {configureFlashcardBodies} from '../src/modules/flashcards/sync/flashcard-body-parser';
import configuration from '../src/config/configuration';
import {AppDataSource} from '../data-source';
import {AppController} from '../src/app.controller';
import {AppService} from '../src/app.service';
import {AppConfigController} from '../src/app-config.controller';
import {NotificationsModule} from '../src/modules/notifications/notifications.module';
import {ProgressModule} from '../src/modules/progress/progress.module';
import {LearningContentModule} from '../src/modules/learning-content/learning-content.module';
import {LevelsModule} from '../src/modules/levels/levels.module';
import {AuthModule} from '../src/modules/auth/auth.module';
import {UsersModule} from '../src/modules/users/users.module';
import {TopicsModule} from '../src/modules/topics/topics.module';
import {GrammarSubTopicsModule} from '../src/modules/grammar-sub-topics/grammar-sub-topics.module';
import {FlashcardFoldersModule} from '../src/modules/flashcard-folders/flashcard-folders.module';
import {FlashcardsModule} from '../src/modules/flashcards/flashcards.module';
import {VocabularyItemsModule} from '../src/modules/vocabulary-items/vocabulary-items.module';
import {GrammarPatternsModule} from '../src/modules/grammar-patterns/grammar-patterns.module';
import {AiModule} from '../src/modules/ai/ai.module';
import {EntitySyncModule} from '../src/modules/entity-sync/entity-sync.module';
import {LearningStreaksModule} from '../src/modules/learning-streaks/learning-streaks.module';
import {VocabularySetsModule} from '../src/modules/vocabulary-sets/vocabulary-sets.module';
import {PracticeModule} from '../src/modules/practice/practice.module';
import {AiGenerationService} from '../src/modules/ai/services/ai-generation.service';
import {FcmProvider} from '../src/modules/notifications/fcm.provider';
import {EmailService} from '../src/modules/auth/services/email.service';
import {ResponseInterceptor} from '../src/common/interceptors/response.interceptor';
import {GlobalExceptionFilter} from '../src/common/filters/global-exception.filter';

const SCHEMA = 'sprint09_serve';
const PORT = Number(process.env.S09_PORT ?? 3099);
const CODES = join(tmpdir(), 's09-codes.json');
const STOP = join(tmpdir(), 's09-stop');

function dbOptions(): any {
  assert.ok(['localhost', '127.0.0.1', '::1'].includes(String((AppDataSource.options as any).host).toLowerCase()), 'refusing non-local database');
  return {
    ...AppDataSource.options, schema: SCHEMA, synchronize: false, migrationsRun: false, uuidExtension: 'pgcrypto',
    installExtensions: false, logging: false,
    extra: {...(AppDataSource.options as any).extra, options: '-c search_path=' + SCHEMA},
  };
}

async function dropSchema(db: DataSource) {
  assert.equal(SCHEMA, 'sprint09_serve');
  await db.query('DROP SCHEMA IF EXISTS "' + SCHEMA + '" CASCADE');
}

async function main() {
  const options = dbOptions();
  const db = new DataSource(options);
  await db.initialize();
  if (process.argv.includes('--cleanup')) {
    await dropSchema(db);
    await db.destroy();
    console.log('CLEANED schema ' + SCHEMA);
    return;
  }
  await dropSchema(db);
  await db.query('CREATE SCHEMA "' + SCHEMA + '"');
  await db.synchronize();

  // Minimal catalog so the app has content to browse.
  const t = (en: string, vi: string, jp: string) => ({en, vi, jp});
  await db.query("INSERT INTO levels(code,name) VALUES('N5',$1),('N4',$2)", [t('N5', 'N5', 'N5'), t('N4', 'N4', 'N4')]);
  const topic = '11111111-1111-4111-8111-111111111111';
  await db.query("INSERT INTO topics(id,slug,level_code,title) VALUES($1,'greetings','N5',$2)", [topic, t('Greetings', 'Chào hỏi', '挨拶')]);
  const words: Array<[string, string, string, string, string, string]> = [
    ['neko', 'neko', 'ねこ', 'cat', 'mèo', '猫'], ['inu', 'inu', 'いぬ', 'dog', 'chó', '犬'],
    ['konnichiwa', 'konnichiwa', 'こんにちは', 'hello', 'xin chào', 'こんにちは'],
  ];
  for (const [slug, romaji, kana, en, vi, jp] of words) {
    await db.query("INSERT INTO vocabulary_items(slug,topic_id,level_code,romaji,kana,meaning,word_type) VALUES($1,$2,'N5',$3,$4,$5,'noun')", [slug, topic, romaji, kana, t(en, vi, jp)]);
  }

  const codes: Record<string, string> = {};
  writeFileSync(CODES, '{}');
  const deliveries: any[] = [];

  @Module({
    imports: [
      ConfigModule.forRoot({isGlobal: true, load: [configuration], envFilePath: '.env.develop'}),
      TypeOrmModule.forRoot(options),
      LevelsModule, LearningContentModule, ProgressModule, NotificationsModule, AuthModule, UsersModule, TopicsModule,
      GrammarSubTopicsModule, FlashcardFoldersModule, FlashcardsModule, VocabularyItemsModule, GrammarPatternsModule,
      AiModule, EntitySyncModule, LearningStreaksModule, VocabularySetsModule, PracticeModule,
    ],
    controllers: [AppController, AppConfigController],
    providers: [AppService],
  })
  class FixtureAppModule {}

  const compiled = await Test.createTestingModule({imports: [FixtureAppModule]})
    .overrideProvider(AiGenerationService).useValue({generateWithRetry: async () => ({content: JSON.stringify({exercises: [{
      type: 'fill_blank', question: {text: 'これは____です。'}, correct_answer: '猫', explanation: {en: 'Cat', vi: 'Mèo'},
    }]})})})
    .overrideProvider(FcmProvider).useValue({configured: () => true, send: async (token: string, data: any) => { deliveries.push({token, data}); return 'sent'; }})
    .overrideProvider(EmailService).useValue({
      sendEmailVerificationCode: async (email: string, code: string) => { codes[email] = code; writeFileSync(CODES, JSON.stringify(codes)); },
    })
    .compile();
  const app = compiled.createNestApplication();
  configureFlashcardBodies(app);
  app.setGlobalPrefix('api', {exclude: ['/']});
  app.useGlobalPipes(new ValidationPipe({whitelist: true, forbidNonWhitelisted: true, transform: true}));
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
  app.enableCors({origin: true});
  await app.listen(PORT, '0.0.0.0');
  console.log('READY http://localhost:' + PORT + '/api schema=' + SCHEMA + ' codes=' + CODES + ' stop-file=' + STOP);

  if (existsSync(STOP)) unlinkSync(STOP);
  const timer = setInterval(async () => {
    if (!existsSync(STOP)) return;
    clearInterval(timer);
    try { unlinkSync(STOP); } catch { /* ignore */ }
    await app.close();
    await dropSchema(db);
    await db.destroy();
    console.log('STOPPED and dropped schema ' + SCHEMA + '; deliveries=' + deliveries.length);
    process.exit(0);
  }, 1000);
  void readFileSync;
}
main().catch(error => { console.error('FAIL serve:', error?.message || error); process.exit(1); });
