import { BadRequestException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw, IsNull, Repository } from 'typeorm';
import { createHash, randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/entity/user.entity';
import { VerificationToken } from '../entity/verification-token.entity';
import { EmailService } from './email.service';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);
  private emailMatch(email: string) {
    return Raw(alias => 'LOWER(' + alias + ') = LOWER(:verificationEmail)', { verificationEmail: email.trim() });
  }
  private log(event: string, fields: Record<string, unknown> = {}, error?: unknown) {
    const detail = error as { name?: string; code?: string; responseCode?: number } | undefined;
    const record = JSON.stringify({ event, ...fields, ...(error ? {
      errorType: detail?.name || 'UnknownError', errorCode: detail?.code, smtpResponseCode: detail?.responseCode,
    } : {}) });
    if (error) this.logger.error(record); else this.logger.log(record);
  }
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly email: EmailService,
  ) {}

  async request(email: string, requestId?: string) {
    const context = { requestId, emailFingerprint: createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 12) };
    this.log('verification.request_received', context);
    let user: User | null;
    try {
      user = await this.users.findOne({ where: { email: this.emailMatch(email) } });
    } catch (error) {
      this.log('verification.account_lookup_failed', context, error);
      throw new ServiceUnavailableException('Unable to request verification right now. Please try again.');
    }
    if (!user) {
      this.log('verification.skipped', { ...context, reason: 'account_not_found' });
      throw new NotFoundException('Không tìm thấy tài khoản nào đăng ký với email này.');
    }
    if (user.email_verified_at) this.log('verification.skipped', { ...context, userId: user.id, reason: 'already_verified' });
    else await this.issue(user, { requestId, failOnDeliveryError: true });
    return { message: 'If this account still needs verification, a code will be sent. Wait two minutes before requesting again.', retry_after_seconds: 120 };
  }

  async issue(user: User, options: { requestId?: string; failOnDeliveryError?: boolean } = {}): Promise<boolean> {
    const context = { requestId: options.requestId, userId: user.id };
    let token: VerificationToken | null;
    let recipient = user.email;
    let code: string;
    try {
      code = randomInt(100000, 1000000).toString();
      const hash = await bcrypt.hash(code, 10);
      token = await this.users.manager.transaction(async manager => {
        const locked = await manager.findOne(User, { where: { id: user.id }, lock: { mode: 'pessimistic_write' } });
        if (!locked || locked.email_verified_at) {
          this.log('verification.skipped', { ...context, reason: locked ? 'already_verified' : 'account_removed' });
          return null;
        }
        recipient = locked.email;
        const repo = manager.getRepository(VerificationToken);
        const recent = await repo.findOne({ where: { user_id: user.id, type: 'email_verification' }, order: { created_at: 'DESC' } });
        // expires_at is explicitly written by this app; legacy created_at is a database
        // timestamp without timezone and can be read seven hours off on this deployment.
        const issuedAt = recent ? recent.expires_at.getTime() - 15 * 60000 : 0;
        if (recent && !recent.used_at && recent.expires_at.getTime() > Date.now() &&
            Date.now() - issuedAt < 120000) {
          this.log('verification.skipped', { ...context, reason: 'resend_cooldown' });
          return null;
        }
        await repo.delete({ user_id: user.id, type: 'email_verification' });
        return repo.save(repo.create({
          user_id: user.id, type: 'email_verification', token_hash: hash,
          expires_at: new Date(Date.now() + 15 * 60000), attempt_count: 0,
        }));
      });
    } catch (error) {
      this.log('verification.challenge_creation_failed', context, error);
      if (options.failOnDeliveryError)
        throw new ServiceUnavailableException('Unable to request verification right now. Please try again.');
      throw error;
    }
    if (!token) return false;
    this.log('verification.challenge_saved', { ...context, challengeId: token.id });
    try {
      await this.email.sendEmailVerificationCode(recipient, code, options.requestId);
      this.log('verification.delivery_accepted', { ...context, challengeId: token.id });
      return true;
    } catch (error) {
      this.log('verification.delivery_failed', { ...context, challengeId: token.id }, error);
      // Delete only this failed challenge, never another concurrently issued challenge.
      try {
        await this.users.manager.getRepository(VerificationToken).delete({ id: token.id });
      } catch (cleanupError) {
        this.log('verification.challenge_cleanup_failed', { ...context, challengeId: token.id }, cleanupError);
      }
      if (options.failOnDeliveryError)
        throw new ServiceUnavailableException('Unable to send the verification email. Please try again.');
      // Registration retains the account and provides its existing retry guidance.
      return false;
    }
  }

  async verify(email: string, code: string) {
    const user = await this.users.findOne({ where: { email: this.emailMatch(email) } });
    if (!user) throw new BadRequestException('Invalid or expired verification code');
    const valid = await this.users.manager.transaction(async manager => {
      const locked = await manager.findOne(User, { where: { id: user.id }, lock: { mode: 'pessimistic_write' } });
      if (!locked || locked.email_verified_at) return false;
      const repo = manager.getRepository(VerificationToken);
      const token = await repo.findOne({
        where: { user_id: user.id, type: 'email_verification', used_at: IsNull() },
        lock: { mode: 'pessimistic_write' },
      });
      if (!token || token.expires_at.getTime() <= Date.now() || token.attempt_count >= 5) return false;
      token.attempt_count += 1;
      const matches = await bcrypt.compare(code, token.token_hash);
      if (matches || token.attempt_count >= 5) token.used_at = new Date();
      await repo.save(token);
      if (!matches) return false;
      await manager.update(User, { id: user.id }, { email_verified_at: new Date() });
      return true;
    });
    if (!valid) throw new BadRequestException('Invalid or expired verification code');
    return { message: 'Email verified. You can now sign in.' };
  }
}
