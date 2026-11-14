import { readAppConfig } from './app-config.controller';
describe('Public application configuration', () => {
  it('has a stable safe default', () => {
    expect(readAppConfig({})).toMatchObject({ schema_version: 1, maintenance: false, minimum_version_code: 1, cache_ttl_seconds: 3600 });
  });
  it('supports maintenance and integer version codes', () => {
    expect(readAppConfig({ APP_MAINTENANCE: 'true', APP_MIN_VERSION_CODE: '21' })).toMatchObject({ maintenance: true, minimum_version_code: 21 });
  });
  it.each(['-1', 'NaN', '1.5', '9007199254740993'])('rejects invalid minimum %s', value => {
    expect(() => readAppConfig({ APP_MIN_VERSION_CODE: value })).toThrow();
  });
  it.each(['0', '86401', '1.2'])('rejects invalid TTL %s', value => {
    expect(() => readAppConfig({ APP_CONFIG_TTL_SECONDS: value })).toThrow();
  });
  it.each(['http://example.test', 'javascript:alert(1)', 'https://user:password@example.test'])('rejects unsafe update destination', value => {
    expect(() => readAppConfig({ APP_UPDATE_URL: value })).toThrow();
  });
  it('rejects ambiguous maintenance flags', () => {
    expect(() => readAppConfig({ APP_MAINTENANCE: 'yes' })).toThrow();
  });
});
