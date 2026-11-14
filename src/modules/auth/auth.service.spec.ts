import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../users/entity/user.entity';
import { UserAuth } from './entity/user-auth.entity';
import { Session } from './entity/session.entity';

describe('Sprint 02 authentication and session security', () => {
  let service: AuthService;
  let user: any;
  let sessions: any[];
  let sessionRepo: any;
  let users: any;
  let auths: any;
  let jwt: JwtService;

  beforeEach(async () => {
    user = { id: 'u1', username: 'learner', email: 'learner@example.test', status: 'active', role: 'user', email_verified_at: new Date() };
    sessions = [];
    users = { findOne: jest.fn(async () => user) };
    auths = { findOne: jest.fn(async () => ({ user_id: user.id, token_version: 0, password_hash: await bcrypt.hash('password123', 4) })) };
    sessionRepo = {
      findOne: jest.fn(async (options: any) => sessions.find(s => s.id === options.where.id && s.user_id === options.where.user_id) || null),
      find: jest.fn(async () => [...sessions]),
      create: (value: any) => ({ ...value }),
      save: jest.fn(async (value: any) => { if (!sessions.some(s => s.id === value.id)) sessions.push(value); return value; }),
      remove: jest.fn(async (value: any) => { sessions = sessions.filter(s => s.id !== value.id); }),
    };
    let queue = Promise.resolve();
    const manager: any = {
      getRepository: (entity: any) => entity === Session ? sessionRepo : entity === User ? users : auths,
      transaction: (action: any) => {
        const task = queue.then(() => action(manager));
        queue = task.catch(() => undefined);
        return task;
      },
    };
    sessionRepo.manager = manager;
    const values: any = { 'jwt.secret': 'test-access-secret', 'jwt.refreshSecret': 'test-refresh-secret',
      'jwt.expiresIn': '15m', 'jwt.refreshExpiresIn': '7d', 'bcrypt.rounds': 4 };
    jwt = new JwtService();
    service = new AuthService(users, auths, sessionRepo, {} as any, jwt,
      { get: (key: string) => values[key] } as ConfigService, {} as any, {} as any);
  });

  it('rejects correct credentials until email is verified', async () => {
    user.email_verified_at = null;
    await expect(service.login({ username: 'learner', password: 'password123' }, 'test', '127.0.0.1'))
      .rejects.toMatchObject({ status: 403 });
    expect(sessionRepo.save).not.toHaveBeenCalled();
  });

  it('hashes the full refresh token and distinguishes token purpose', async () => {
    const result = await service.login({ username: 'learner', password: 'password123' }, 'test', '127.0.0.1');
    const payload: any = jwt.decode(result.refreshToken);
    expect(payload.token_use).toBe('refresh');
    expect(jwt.decode(result.accessToken)['token_use']).toBe('access');
    const digest = createHash('sha256').update(result.refreshToken).digest('hex');
    expect(await bcrypt.compare(digest, sessions[0].refresh_token_hash)).toBe(true);
    expect(await bcrypt.compare(result.refreshToken, sessions[0].refresh_token_hash)).toBe(false);
  });

  it('rotates once and rejects replay even when issuance happens in the same second', async () => {
    const result = await service.login({ username: 'learner', password: 'password123' }, 'test', '127.0.0.1');
    const rotated = await service.refreshToken(result.refreshToken);
    expect(rotated.refreshToken).not.toEqual(result.refreshToken);
    await expect(service.refreshToken(result.refreshToken)).rejects.toMatchObject({ status: 401 });
    expect(sessionRepo.findOne).toHaveBeenCalledWith(expect.objectContaining({ lock: { mode: 'pessimistic_write' } }));
  });

  it('accepts only one concurrent refresh of the same token under a serialized transaction', async () => {
    const result = await service.login({ username: 'learner', password: 'password123' }, 'test', '127.0.0.1');
    const results = await Promise.allSettled([service.refreshToken(result.refreshToken), service.refreshToken(result.refreshToken)]);
    expect(results.filter(value => value.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter(value => value.status === 'rejected')).toHaveLength(1);
  });

  it('rejects an access token at the refresh endpoint', async () => {
    const result = await service.login({ username: 'learner', password: 'password123' }, 'test', '127.0.0.1');
    await expect(service.refreshToken(result.accessToken)).rejects.toMatchObject({ status: 401 });
  });

  it('revokes access after logout, not only after JWT expiry', async () => {
    const result = await service.login({ username: 'learner', password: 'password123' }, 'test', '127.0.0.1');
    const payload: any = jwt.decode(result.accessToken);
    await expect(service.validateUser(user.id, 0, payload.sid)).resolves.toMatchObject({ id: user.id });
    await service.logout(user.id, result.refreshToken);
    await expect(service.validateUser(user.id, 0, payload.sid)).rejects.toMatchObject({ status: 401 });
  });

  it('rejects an expired stored session', async () => {
    const result = await service.login({ username: 'learner', password: 'password123' }, 'test', '127.0.0.1');
    sessions[0].expires_at = new Date(0);
    await expect(service.refreshToken(result.refreshToken)).rejects.toMatchObject({ status: 401 });
  });
});
