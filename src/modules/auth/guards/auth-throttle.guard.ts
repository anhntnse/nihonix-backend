import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';

/** Per-process IP backstop; challenge attempt limits are additionally persisted in PostgreSQL. */
@Injectable()
export class AuthThrottleGuard implements CanActivate {
  private readonly buckets = new Map<string, { count: number; until: number }>();

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const request = http.getRequest();
    if (request.method !== 'POST' || /\/(me|logout|refresh)$/.test(request.path)) return true;
    const now = Date.now();
    for (const [key, value] of this.buckets) if (value.until <= now) this.buckets.delete(key);
    const key = String(request.ip || request.socket?.remoteAddress || 'unknown');
    let bucket = this.buckets.get(key);
    if (!bucket) {
      if (this.buckets.size >= 10000) throw new HttpException('Try again later', HttpStatus.TOO_MANY_REQUESTS);
      bucket = { count: 0, until: now + 60000 };
      this.buckets.set(key, bucket);
    }
    if (++bucket.count > 10) {
      http.getResponse().setHeader('Retry-After', Math.ceil((bucket.until - now) / 1000));
      throw new HttpException('Too many attempts. Try again in a minute.', HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }
}
