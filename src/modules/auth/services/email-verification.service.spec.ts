import * as bcrypt from 'bcrypt';
import { EmailVerificationService } from './email-verification.service';
import { User } from '../../users/entity/user.entity';
import { VerificationToken } from '../entity/verification-token.entity';

describe('Email verification challenges', () => {
  let user: any;
  let token: any;
  let service: EmailVerificationService;
  let users: any;
  let tokens: any;
  let manager: any;
  let email: any;

  beforeEach(async () => {
    user = { id: 'u1', email: 'learner@example.test', email_verified_at: null };
    token = { id: 't1', user_id: user.id, type: 'email_verification',
      token_hash: await bcrypt.hash('123456', 4), expires_at: new Date(Date.now() + 900000),
      created_at: new Date(), used_at: null, attempt_count: 0 };
    tokens = {
      findOne: jest.fn(async (options: any) => token && (!options.where.used_at || !token.used_at) ? token : null),
      save: jest.fn(async (value: any) => { token = value; return value; }),
      delete: jest.fn(async () => { token = null; }),
      create: (value: any) => ({ ...value, id: 'new', created_at: new Date() }),
    };
    manager = {
      findOne: jest.fn(async () => user),
      getRepository: (entity: any) => entity === VerificationToken ? tokens : users,
      update: jest.fn(async (_entity: any, _where: any, update: any) => Object.assign(user, update)),
      transaction: (action: any) => action(manager),
    };
    users = { findOne: jest.fn(async () => user), manager };
    email = { sendEmailVerificationCode: jest.fn(async () => undefined) };
    service = new EmailVerificationService(users, email);
  });

  it('saves a hashed six-digit OTP before submitting the email', async () => {
    token = null;
    await service.request(user.email, 'trace-test');
    expect(email.sendEmailVerificationCode).toHaveBeenCalledWith(user.email, expect.stringMatching(/^[0-9]{6}$/), 'trace-test');
    const code = email.sendEmailVerificationCode.mock.calls[0][1];
    expect(token.token_hash).not.toBe(code);
    expect(await bcrypt.compare(code, token.token_hash)).toBe(true);
    expect(tokens.save.mock.invocationCallOrder[0]).toBeLessThan(email.sendEmailVerificationCode.mock.invocationCallOrder[0]);
  });

  it('returns 503 rather than claiming success after SMTP failure', async () => {
    token = null;
    email.sendEmailVerificationCode.mockRejectedValue(Object.assign(new Error('SMTP failed'), { code: 'EAUTH', responseCode: 535 }));
    await expect(service.request(user.email, 'trace-test')).rejects.toMatchObject({ status: 503 });
    expect(tokens.delete).toHaveBeenCalledWith({ id: 'new' });
  });

  it('can retry immediately after a failed SMTP submission', async () => {
    token = null;
    email.sendEmailVerificationCode.mockRejectedValueOnce(new Error('temporary error'));
    await expect(service.request(user.email)).rejects.toMatchObject({ status: 503 });
    await expect(service.request(user.email)).resolves.toHaveProperty('retry_after_seconds', 120);
    expect(email.sendEmailVerificationCode).toHaveBeenCalledTimes(2);
  });

  it('does not suppress a resend for an expired or consumed challenge', async () => {
    token.expires_at = new Date(0);
    await service.request(user.email);
    expect(email.sendEmailVerificationCode).toHaveBeenCalledTimes(1);
    token.used_at = new Date();
    await service.request(user.email);
    expect(email.sendEmailVerificationCode).toHaveBeenCalledTimes(2);
  });

  it('logs already-verified and cooldown skips without sending', async () => {
    user.email_verified_at = new Date();
    await service.request(user.email);
    expect(email.sendEmailVerificationCode).not.toHaveBeenCalled();
  });

  it('reports database lookup failure without calling SMTP', async () => {
    users.findOne.mockRejectedValue(new Error('database unavailable'));
    await expect(service.request(user.email)).rejects.toMatchObject({ status: 503 });
    expect(email.sendEmailVerificationCode).not.toHaveBeenCalled();
  });

  it('does not interpret underscores in email addresses as lookup wildcards', async () => {
    users.findOne.mockResolvedValue(null);
    await expect(service.request('first_last@example.test')).rejects.toMatchObject({ status: 404 });
    const query = users.findOne.mock.calls[0][0].where.email;
    expect(query.type).toBe('raw');
    expect(query.objectLiteralParameters.verificationEmail).toBe('first_last@example.test');
  });

  it('verifies once and rejects reuse', async () => {
    await expect(service.verify(user.email, '123456')).resolves.toHaveProperty('message');
    expect(user.email_verified_at).toBeInstanceOf(Date);
    await expect(service.verify(user.email, '123456')).rejects.toMatchObject({ status: 400 });
  });

  it('commits failed attempt counts and stops after five guesses', async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      await expect(service.verify(user.email, '000000')).rejects.toMatchObject({ status: 400 });
    }
    expect(token.attempt_count).toBe(5);
    expect(token.used_at).toBeInstanceOf(Date);
    await expect(service.verify(user.email, '123456')).rejects.toMatchObject({ status: 400 });
    expect(user.email_verified_at).toBeNull();
  });

  it('rejects expired challenges', async () => {
    token.expires_at = new Date(0);
    await expect(service.verify(user.email, '123456')).rejects.toMatchObject({ status: 400 });
    expect(manager.update).not.toHaveBeenCalled();
  });

  it('keeps cooldown when legacy database creation timestamps have a timezone offset', async () => {
    token.created_at = new Date(Date.now() - 7 * 60 * 60000);
    await service.request(user.email);
    expect(email.sendEmailVerificationCode).not.toHaveBeenCalled();
  });

  it('does not send another code within the resend cooldown', async () => {
    await service.request(user.email);
    expect(email.sendEmailVerificationCode).not.toHaveBeenCalled();
  });

  it('returns the requested account-not-found error without calling the mail provider', async () => {
    users.findOne.mockResolvedValue(null);
    await expect(service.request('unknown@example.test')).rejects.toMatchObject({ status: 404, message: 'Không tìm thấy tài khoản nào đăng ký với email này.' });
    expect(email.sendEmailVerificationCode).not.toHaveBeenCalled();
  });

  it('leaves an account unverified and removes its undelivered challenge when mail fails', async () => {
    token = null;
    email.sendEmailVerificationCode.mockRejectedValue(new Error('provider unavailable'));
    await expect(service.issue(user)).resolves.toBe(false);
    expect(user.email_verified_at).toBeNull();
    expect(tokens.delete).toHaveBeenCalledWith({ id: 'new' });
  });
});
