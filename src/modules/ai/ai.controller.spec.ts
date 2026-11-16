import {AiController} from './ai.controller';

describe('AI health exposure', () => {
  const service = {healthCheck: jest.fn(async () => ({status: 'unavailable', configured: false}))};
  const requests = {quota: jest.fn(async () => ({max_items: 15}))};
  const controller = new AiController(service as any, requests as any);

  beforeEach(() => jest.clearAllMocks());

  it('public health is liveness only and does not reveal provider configuration', async () => {
    expect(await controller.health()).toEqual({status: 'ok'});
    expect(service.healthCheck).not.toHaveBeenCalled();
  });

  it('authenticated quota retains provider readiness needed by the Android client', async () => {
    expect(await controller.quota({user: {id: 'owner'}, headers: {}}))
      .toEqual({max_items: 15, provider: {status: 'unavailable', configured: false}});
  });
});
