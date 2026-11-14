import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, ILike } from 'typeorm';
import { createHash, randomInt, randomUUID } from 'crypto';
import { EmailVerificationService } from './services/email-verification.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '@users/entity/user.entity';
import { UserAuth } from '@auth/entity/user-auth.entity';
import { Session } from '@auth/entity/session.entity';
import { VerificationToken } from '@auth/entity/verification-token.entity';
import { UserRole } from '@enums/user-role.enum';
import { RegisterDto, LoginDto, ForgotPasswordDto, VerifyResetCodeDto, ResetPasswordDto, ResendCodeDto } from '@auth/dto';
import { EmailService } from '@auth/services/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserAuth)
    private userAuthRepository: Repository<UserAuth>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    @InjectRepository(VerificationToken)
    private verificationTokenRepository: Repository<VerificationToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
    private emailVerification: EmailVerificationService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const username = dto.username.trim();
    if (username.length < 3 || username.length > 50) throw new BadRequestException('Username must be 3–50 characters');
    if (Buffer.byteLength(dto.password, 'utf8') > 72) throw new BadRequestException('Password must be at most 72 UTF-8 bytes');
    if (await this.userRepository.findOne({ where: [{ username }, { email: ILike(email) }] })) {
      throw new ConflictException('Username or email already exists');
    }
    const hash = await bcrypt.hash(dto.password, this.configService.get('bcrypt.rounds') || 12);
    const user = await this.userRepository.manager.transaction(async manager => {
      const users = manager.getRepository(User);
      const saved = await users.save(users.create({
        username, email, full_name: dto.full_name, status: 'active', role: UserRole.USER, email_verified_at: null,
      }));
      await manager.getRepository(UserAuth).save({ user_id: saved.id, password_hash: hash, token_version: 0 });
      return saved;
    }).catch(error => {
      if (error.code === '23505') throw new ConflictException('Username or email already exists');
      throw error;
    });
    const sent = await this.emailVerification.issue(user);
    return { user, verification_required: true, message: sent ?
      'Account created. Check your email for a verification code.' :
      'Account created. Request a verification code to finish signing up.' };
  }

  async login(loginDto: LoginDto, userAgent: string, ip: string) {
    // Validate input
    if (!loginDto.password || typeof loginDto.password !== 'string') {
      throw new BadRequestException('Password is required and must be a string');
    }

    // Find user with level relation
    const user = await this.userRepository.findOne({
      where: { username: loginDto.username },
      relations: ['level'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get user auth
    const userAuth = await this.userAuthRepository.findOne({
      where: { user_id: user.id },
      select: ['user_id', 'password_hash', 'token_version'],
    });

    if (!userAuth) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password hash exists
    if (!userAuth.password_hash || typeof userAuth.password_hash !== 'string') {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      userAuth.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.email_verified_at) throw new ForbiddenException({ code: 'EMAIL_NOT_VERIFIED', message: 'Verify your email before signing in.' });
    if (user.status !== 'active') throw new UnauthorizedException('User account is inactive or suspended');
    const sessionId = randomUUID();

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      userAuth.token_version,
      user.role,
      sessionId,
    );

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const session = this.sessionRepository.create({
      id: sessionId,
      user_id: user.id,
      refresh_token_hash: await bcrypt.hash(this.refreshDigest(refreshToken), 10),
      user_agent: userAgent,
      ip,
      expires_at: expiresAt,
    });
    await this.sessionRepository.save(session);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        language: user.language,
        status: user.status,
        role: user.role,
        level_code: user.level_code,
        level: user.level,
        created_at: user.created_at,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, { secret: this.configService.get('jwt.refreshSecret') });
      if (payload.token_use !== 'refresh' || !payload.sid) throw new UnauthorizedException('Invalid refresh token');
      return await this.sessionRepository.manager.transaction(async manager => {
        const sessions = manager.getRepository(Session);
        const session = await sessions.findOne({ where: { id: payload.sid, user_id: payload.sub }, lock: { mode: 'pessimistic_write' } });
        if (!session || !session.expires_at || session.expires_at < new Date() ||
            !await bcrypt.compare(this.refreshDigest(refreshToken), session.refresh_token_hash)) throw new UnauthorizedException('Invalid refresh token');
        const auth = await manager.getRepository(UserAuth).findOne({ where: { user_id: payload.sub } });
        const user = await manager.getRepository(User).findOne({ where: { id: payload.sub } });
        if (!auth || auth.token_version !== payload.tokenVersion || !user || user.status !== 'active' || !user.email_verified_at) {
          throw new UnauthorizedException('Session expired');
        }
        const tokens = await this.generateTokens(user.id, auth.token_version, user.role, session.id);
        session.refresh_token_hash = await bcrypt.hash(this.refreshDigest(tokens.refreshToken), 10);
        await sessions.save(session);
        return tokens;
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken: string) {
    const sessions = await this.sessionRepository.find({
      where: { user_id: userId },
    });

    for (const session of sessions) {
      const isValid = await bcrypt.compare(
        this.refreshDigest(refreshToken),
        session.refresh_token_hash,
      );
      if (isValid) {
        await this.sessionRepository.remove(session);
        return { message: 'Logged out successfully' };
      }
    }

    throw new BadRequestException('Session not found');
  }

  async validateUser(userId: string, tokenVersion?: number, sessionId?: string) {
    const session = sessionId ? await this.sessionRepository.findOne({ where: { id: sessionId, user_id: userId } }) : null;
    if (!session || !session.expires_at || session.expires_at <= new Date()) throw new UnauthorizedException('Session has expired or been revoked');
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.email_verified_at || user.status !== 'active') {
      throw new UnauthorizedException('User account is inactive or suspended');
    }

    if (tokenVersion !== undefined) {
      const userAuth = await this.userAuthRepository.findOne({
        where: { user_id: userId },
        select: ['user_id', 'token_version'],
      });

      if (!userAuth || userAuth.token_version !== tokenVersion) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    // Return user with role for JWT strategy
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['level'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Return full user profile with level
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      language: user.language,
      status: user.status,
      role: user.role,
      level_code: user.level_code,
      level: user.level,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  private refreshDigest(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async generateTokens(userId: string, tokenVersion: number, role: UserRole, sessionId: string) {
    const accessToken = this.jwtService.sign(
      { sub: userId, tokenVersion, role, token_use: 'access', sid: sessionId, jti: randomUUID() },
      { secret: this.configService.get('jwt.secret'), expiresIn: this.configService.get('jwt.expiresIn') },
    );
    const refreshToken = this.jwtService.sign(
      { sub: userId, tokenVersion, role, token_use: 'refresh', sid: sessionId, jti: randomUUID() },
      { secret: this.configService.get('jwt.refreshSecret'), expiresIn: this.configService.get('jwt.refreshExpiresIn') },
    );
    return { accessToken, refreshToken };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: ILike(email.trim()) },
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return {
        message: 'If the email exists, a password reset code has been sent',
      };
    }

    // Check if there's a recent reset attempt (within 2 minutes)
    const recentToken = await this.verificationTokenRepository.findOne({
      where: {
        user_id: user.id,
        type: 'password_reset',
      },
      order: { created_at: 'DESC' },
    });

    if (recentToken) {
      const timeDiff = Date.now() - recentToken.created_at.getTime();
      const twoMinutes = 2 * 60 * 1000; // 2 minutes in milliseconds
      
      if (timeDiff < twoMinutes) {
        const remainingTime = Math.ceil((twoMinutes - timeDiff) / 1000);
        throw new BadRequestException(
          `Please wait ${remainingTime} seconds before requesting a new code`
        );
      }
    }

    // Generate 6-digit code
    const code = randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(code, 10);

    // Set expiration time (15 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Invalidate any existing password reset tokens for this user
    await this.verificationTokenRepository.delete({
      user_id: user.id,
      type: 'password_reset',
    });

    // Create new verification token
    const verificationToken = this.verificationTokenRepository.create({
      user_id: user.id,
      type: 'password_reset',
      token_hash: codeHash,
      expires_at: expiresAt,
    });
    await this.verificationTokenRepository.save(verificationToken);

    // Send email with reset code
    await this.emailService.sendPasswordResetCode(user.email, code, user.username);

    return {
      message: 'If the email exists, a password reset code has been sent',
    };
  }

  async verifyResetCode(dto: VerifyResetCodeDto) {
    const user = await this.userRepository.findOne({ where: { email: ILike(dto.email.trim()) } });
    if (!user || !/^\d{6}$/.test(dto.code)) throw new BadRequestException('Invalid or expired reset code');
    const tokenId = await this.verificationTokenRepository.manager.transaction(async manager => {
      const repo = manager.getRepository(VerificationToken);
      const token = await repo.findOne({ where: { user_id: user.id, type: 'password_reset', used_at: IsNull() }, lock: { mode: 'pessimistic_write' } });
      if (!token || token.expires_at <= new Date() || token.attempt_count >= 5) return null;
      token.attempt_count += 1;
      const matches = await bcrypt.compare(dto.code, token.token_hash);
      if (!matches && token.attempt_count >= 5) token.used_at = new Date();
      await repo.save(token);
      return matches ? token.id : null;
    });
    if (!tokenId) throw new BadRequestException('Invalid or expired reset code');
    const token = this.jwtService.sign({ sub: user.id, type: 'password_reset', tokenId },
      { secret: this.configService.get('jwt.secret'), expiresIn: '10m' });
    return { valid: true, token, message: 'Code verified. Choose a new password.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    let payload: any;
    try { payload = this.jwtService.verify(dto.token, { secret: this.configService.get('jwt.secret') }); }
    catch { throw new BadRequestException('Invalid or expired reset token'); }
    if (payload.type !== 'password_reset') throw new BadRequestException('Invalid reset token');
    if (Buffer.byteLength(dto.password, 'utf8') > 72) throw new BadRequestException('Password must be at most 72 UTF-8 bytes');
    const hash = await bcrypt.hash(dto.password, this.configService.get('bcrypt.rounds') || 12);
    await this.verificationTokenRepository.manager.transaction(async manager => {
      const tokens = manager.getRepository(VerificationToken);
      const token = await tokens.findOne({ where: { id: payload.tokenId }, lock: { mode: 'pessimistic_write' } });
      if (!token || token.type !== 'password_reset' || token.user_id !== payload.sub || token.used_at || token.expires_at <= new Date()) {
        throw new BadRequestException('Invalid or expired reset token');
      }
      const auths = manager.getRepository(UserAuth);
      const auth = await auths.findOne({ where: { user_id: token.user_id }, lock: { mode: 'pessimistic_write' } });
      if (!auth) throw new BadRequestException('User authentication not found');
      auth.password_hash = hash;
      auth.token_version += 1;
      await auths.save(auth);
      token.used_at = new Date();
      await tokens.save(token);
      await manager.getRepository(Session).delete({ user_id: token.user_id });
    });
    return { message: 'Password reset successfully. Sign in with your new password.' };
  }

  async resendCode(resendCodeDto: ResendCodeDto) {
    const { email } = resendCodeDto;

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email: ILike(email.trim()) },
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return {
        message: 'If the email exists, a new password reset code has been sent',
      };
    }

    // Check if there's a recent reset attempt (within 2 minutes)
    const recentToken = await this.verificationTokenRepository.findOne({
      where: {
        user_id: user.id,
        type: 'password_reset',
      },
      order: { created_at: 'DESC' },
    });

    if (recentToken) {
      const timeDiff = Date.now() - recentToken.created_at.getTime();
      const twoMinutes = 2 * 60 * 1000; // 2 minutes in milliseconds
      
      if (timeDiff < twoMinutes) {
        const remainingTime = Math.ceil((twoMinutes - timeDiff) / 1000);
        throw new BadRequestException(
          `Please wait ${remainingTime} seconds before requesting a new code`
        );
      }
    }

    // Generate new 6-digit code
    const code = randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(code, 10);

    // Set expiration time (15 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Invalidate any existing password reset tokens for this user
    await this.verificationTokenRepository.delete({
      user_id: user.id,
      type: 'password_reset',
    });

    // Create new verification token
    const verificationToken = this.verificationTokenRepository.create({
      user_id: user.id,
      type: 'password_reset',
      token_hash: codeHash,
      expires_at: expiresAt,
    });
    await this.verificationTokenRepository.save(verificationToken);

    // Send email with new reset code
    await this.emailService.sendPasswordResetCode(user.email, code, user.username);

    return {
      message: 'If the email exists, a new password reset code has been sent',
    };
  }
}
