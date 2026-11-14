import { randomUUID } from 'crypto';
import { Response } from 'express';

/** Server-owned correlation ID. Do not log or trust arbitrary caller-provided IDs. */
export function requestId(response: Response): string {
  const existing = response.getHeader('X-Request-Id');
  if (typeof existing === 'string') return existing;
  const id = randomUUID();
  response.setHeader('X-Request-Id', id);
  return id;
}
