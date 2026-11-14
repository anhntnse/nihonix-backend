/**
 * HTTP -> database -> EmailService regression harness.
 * Uses only a unique local PostgreSQL schema. --live-smtp explicitly sends one
 * real OTP email to the previously authorized recipient; no persistent account.
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
import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import configuration from '../src/config/configuration';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { AuthThrottleGuard } from '../src/modules/auth/guards/auth-throttle.guard';
import { EmailService } from '../src/modules/auth/services/email.service';
import { EmailVerificationService } from '../src/modules/auth/services/email-verification.service';
import { User } from '../src/modules/users/entity/user.entity';
import { VerificationToken } from '../src/modules/auth/entity/verification-token.entity';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';

async function run() {
  const live = process.argv.includes('--live-smtp');
  const host = String((AppDataSource.options as any).host || 'localhost').toLowerCase();
  assert.ok(['localhost','127.0.0.1','::1'].includes(host), 'Requires local PostgreSQL');
  const schema = 'verification_test_' + randomUUID().replace(/-/g, '');
  const options: any = { ...AppDataSource.options, schema, synchronize: false, migrationsRun: false,
    uuidExtension: 'pgcrypto', installExtensions: false, logging: false,
    extra: { ...(AppDataSource.options as any).extra, options: '-c search_path=' + schema } };
  const database = new DataSource(options);
  let created = false;
  let app: any;
  let mail: EmailService | undefined;
  let submittedCode = '';
  let submissions = 0;
  let fail = false;
  try {
    await database.initialize();
    await database.query('CREATE SCHEMA "' + schema + '"');
    created = true;
    assert.equal((await database.query('SELECT current_schema() AS name'))[0].name, schema);
    await database.synchronize();
    const email = 'helloanhne@gmail.com';
    const id = randomUUID();
    await database.query('INSERT INTO users (id,username,email) VALUES ($1,$2,$3)', [id,'verification-test',email]);
    const builder = Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [configuration] }),
        TypeOrmModule.forRoot(options), TypeOrmModule.forFeature([User, VerificationToken])],
      controllers: [AuthController],
      providers: [EmailVerificationService, EmailService, AuthThrottleGuard, { provide: AuthService, useValue: {} }],
    });
    if (!live) builder.overrideProvider(EmailService).useValue({
      sendEmailVerificationCode: async (_email: string, code: string) => {
        submissions++; submittedCode = code;
        if (fail) throw Object.assign(new Error('simulated SMTP outage'), { code: 'ECONNECTION' });
      },
    });
    const module = await builder.compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist:true, forbidNonWhitelisted:true, transform:true }));
    app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    if (live) mail = app.get(EmailService);
    const api = request(app.getHttpServer());
    const route = '/api/auth/request-email-verification';
    const unknown = await api.post(route).send({email:'unknown@example.test'}).expect(404);
    assert.equal(unknown.body.message,'Không tìm thấy tài khoản nào đăng ký với email này.');
    assert.equal((await database.query('SELECT count(*)::int AS count FROM verification_tokens'))[0].count,0);
    const sent = await api.post(route).send({email}).expect(200);
    assert.equal(sent.body.data.retry_after_seconds,120);
    assert.match(sent.headers['x-request-id'],/^[0-9a-f-]{36}$/);
    const rows = await database.query("SELECT token_hash,expires_at,created_at,used_at FROM verification_tokens WHERE user_id=$1 AND type='email_verification'",[id]);
    assert.equal(rows.length,1);
    assert.ok(new Date(rows[0].expires_at).getTime() > Date.now() + 14 * 60000);
    console.log(JSON.stringify({ cooldownCreatedAgeMs:Date.now()-new Date(rows[0].created_at).getTime(),expiryRemainingMs:new Date(rows[0].expires_at).getTime()-Date.now(),used:!!rows[0].used_at }));
    await api.post(route).send({email}).expect(200); // no duplicate email inside cooldown
    if (!live) {
      assert.equal(submissions,1);
      assert.match(submittedCode,/^[0-9]{6}$/);
      assert.ok(await bcrypt.compare(submittedCode,rows[0].token_hash));
      await api.post('/api/auth/verify-email').send({email,code:submittedCode}).expect(200);
      await api.post(route).send({email}).expect(200);
      assert.equal(submissions,1);
      await database.query('UPDATE users SET email_verified_at=NULL WHERE id=$1',[id]);
      fail=true;
      await api.post(route).send({email}).expect(503);
      assert.equal((await database.query('SELECT count(*)::int AS count FROM verification_tokens WHERE user_id=$1',[id]))[0].count,0);
      fail=false;
      await api.post(route).send({email}).expect(200);
      assert.equal(submissions,3);
    }
    console.log(live ? 'PASS: live HTTP -> saved hashed OTP -> real EmailService -> SMTP accepted. Temporary test account/schema only.' :
      'PASS: HTTP/DB verification issuance, missing-account 404 and verified-account skip, cooldown, SMTP failure 503, failed-challenge cleanup and immediate retry.');
  } finally {
    if (mail) await mail.closeTransporter();
    if (app) await app.close();
    if (created && database.isInitialized) {
      assert.match(schema,/^verification_test_[a-f0-9]{32}$/);
      await database.query('DROP SCHEMA "'+schema+'" CASCADE');
    }
    if (database.isInitialized) await database.destroy();
  }
}
run().catch((error: any) => {
  console.error(JSON.stringify({ result:'FAIL',errorType:error.name,code:error.code || 'none',status:error.status,location:String(error.stack || '').split('\n').filter((line:string) => line.trim().startsWith('at ')).slice(0,3) }));
  process.exitCode=1;
});
