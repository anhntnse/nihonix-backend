import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UpdateLearningSettingsDto } from './dto/learning-settings.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from './entity/user.entity';

describe('Sprint 02 owner-scoped profile and settings', () => {
  it('rejects another users profile before querying it', async () => {
    const users = { findById: jest.fn() };
    const controller = new UsersController(users as any, {} as any);
    await expect(controller.findOne('someone-else', { user: { id: 'owner', role: 'user' } }))
      .rejects.toMatchObject({ status: 403 });
    expect(users.findById).not.toHaveBeenCalled();
  });

  it('uses the authenticated owner for the profile endpoint', async () => {
    const users = { update: jest.fn(async () => ({ id: 'owner' })) };
    const controller = new UsersController(users as any, {} as any);
    await controller.updateMyProfile({ user: { id: 'owner' } }, { full_name: 'New Name' });
    expect(users.update).toHaveBeenCalledWith('owner', { full_name: 'New Name' });
  });

  it('rejects self-service email/status changes through the legacy endpoint', async () => {
    const users = { update: jest.fn() };
    const controller = new UsersController(users as any, {} as any);
    await expect(controller.update('owner', { status: 'active' }, { user: { id: 'owner', role: 'user' } }))
      .rejects.toMatchObject({ status: 403 });
    expect(users.update).not.toHaveBeenCalled();
  });

  it('validates timezone, reminder time and goal bounds', async () => {
    const invalid = plainToInstance(UpdateLearningSettingsDto, {
      daily_goal_minutes: 0, reminder_time: '25:90', timezone: 'not-a-zone', push_enabled: 'yes',
    });
    expect(await validate(invalid)).toHaveLength(4);
    const valid = plainToInstance(UpdateLearningSettingsDto, {
      daily_goal_minutes: 30, reminder_time: '21:30', timezone: 'Asia/Ho_Chi_Minh', push_enabled: true,
    });
    expect(await validate(valid)).toHaveLength(0);
  });

  it('merges partial settings while holding the owner row lock', async () => {
    const user: any = { id: 'owner', learning_settings: { daily_goal_minutes: 20, timezone: 'UTC' } };
    const repo = { findOne: jest.fn(async () => user), save: jest.fn(async value => value) };
    const manager: any = { getRepository: (entity: any) => { expect(entity).toBe(User); return repo; } };
    const service = new UsersService({ manager: { transaction: (fn: any) => fn(manager) } } as any, {} as any);
    const settings = await service.updateSettings('owner', { reminder_enabled: true });
    expect(settings).toMatchObject({ daily_goal_minutes: 20, timezone: 'UTC', reminder_enabled: true });
    expect(repo.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'owner' }, lock: { mode: 'pessimistic_write' } }));
  });

  it('rejects null settings without changing stored data', async () => {
    const service = new UsersService({} as any, {} as any);
    await expect(service.updateSettings('owner', { timezone: null } as any)).rejects.toMatchObject({ status: 400 });
  });

  it('rejects profile escalation fields under the actual validation options', async () => {
    const dto = plainToInstance(UpdateProfileDto, { full_name: 'Name', role: 'admin', id: 'someone-else' });
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors.map(value => value.property).sort()).toEqual(['id', 'role']);
  });
});
