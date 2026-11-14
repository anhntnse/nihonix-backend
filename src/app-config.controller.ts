import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';

export function readAppConfig(env: NodeJS.ProcessEnv = process.env) {
  const min = Number(env.APP_MIN_VERSION_CODE ?? '1');
  const ttl = Number(env.APP_CONFIG_TTL_SECONDS ?? '3600');
  if (!Number.isSafeInteger(min) || min < 1 || !Number.isInteger(ttl) || ttl < 60 || ttl > 86400 ||
      (env.APP_MAINTENANCE !== undefined && !['true', 'false'].includes(env.APP_MAINTENANCE)))
    throw new ServiceUnavailableException('Application configuration is unavailable');
  const update = env.APP_UPDATE_URL || 'https://play.google.com/store/apps/details?id=com.nihonix.mobile';
  let url: URL;
  try { url = new URL(update); } catch { throw new ServiceUnavailableException('Application configuration is unavailable'); }
  if (url.protocol !== 'https:' || url.username || url.password) throw new ServiceUnavailableException('Application configuration is unavailable');
  return { schema_version: 1, maintenance: env.APP_MAINTENANCE === 'true',
    maintenance_message: (env.APP_MAINTENANCE_MESSAGE || 'Nihonix is temporarily under maintenance. Please try again later.').slice(0, 500),
    minimum_version_code: min, update_url: update, cache_ttl_seconds: ttl };
}
@Controller('app')
export class AppConfigController {
  @Get('config')
  config() { return readAppConfig(); }
}
