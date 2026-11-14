import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
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
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: [{ username: registerDto.username }, { email: registerDto.email }],
    });

    if (existingUser) {
      throw new ConflictException('Username or email already exists');
    }

    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      this.configService.get('bcrypt.rounds') || 12,      
    );

    const user = this.userRepository.create({
      username: registerDto.username,
      email: registerDto.email,
      full_name: registerDto.full_name,
      status: 'active',
      role: UserRole.USER, // Default role
    });
    await this.userRepository.save(user);

    // Create user auth
    const userAuth = this.userAuthRepository.create({
      user_id: user.id,
      password_hash: hashedPassword,
      token_version: 0,
    });
    await this.userAuthRepository.save(userAuth);

    // Fetch user with level relation for consistent response
    const userWithLevel = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['level'],
    });

    if (!userWithLevel) {
      throw new BadRequestException('Failed to fetch user after registration');
    }

    return {
      user: {
        id: userWithLevel.id,
        username: userWithLevel.username,
        email: userWithLevel.email,
        full_name: userWithLevel.full_name,
        avatar_url: userWithLevel.avatar_url,
        language: userWithLevel.language,
        status: userWithLevel.status,
        role: userWithLevel.role,
        level_code: userWithLevel.level_code,
        level: userWithLevel.level,
        created_at: userWithLevel.created_at,
      },
    };
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

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      userAuth.token_version,
      user.role,
    );

    // Create session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const sessionId = `${user.id}_${Date.now()}_${Math.random().toString(36)}`;
    const session = this.sessionRepository.create({
      id: sessionId,
      user_id: user.id,
      refresh_token_hash: await bcrypt.hash(refreshToken, 10),
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
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      // Find session
      const sessions = await this.sessionRepository.find({
        where: { user_id: payload.sub },
      });

      let validSession: Session | null = null;
      for (const session of sessions) {
        const isValid = await bcrypt.compare(
          refreshToken,
          session.refresh_token_hash,
        );
        if (isValid) {
          validSession = session;
          break;
        }
      }

      if (!validSession || validSession.expires_at < new Date()) {   
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Get user auth to check token version
      const userAuth = await this.userAuthRepository.findOne({
        where: { user_id: payload.sub },
        select: ['user_id', 'password_hash', 'token_version'],
      }); 

      if (!userAuth || userAuth.token_version !== payload.tokenVersion) {
        throw new UnauthorizedException('Token version mismatch');
      }

      // Get user to get role
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens with role
      const tokens = await this.generateTokens(
        payload.sub,
        userAuth.token_version,
        user.role,
      );

      // Update session
      validSession.refresh_token_hash = await bcrypt.hash(
        tokens.refreshToken,
        10,
      );
      await this.sessionRepository.save(validSession);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken: string) {
    const sessions = await this.sessionRepository.find({
      where: { user_id: userId },
    });

    for (const session of sessions) {
      const isValid = await bcrypt.compare(
        refreshToken,
        session.refresh_token_hash,
      );
      if (isValid) {
        await this.sessionRepository.remove(session);
        return { message: 'Logged out successfully' };
      }
    }

    throw new BadRequestException('Session not found');
  }

  async validateUser(userId: string, tokenVersion?: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== 'active') {
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

  private async generateTokens(
    userId: string,
    tokenVersion: number,
    role: UserRole = UserRole.USER,
  ) {
    const accessToken = this.jwtService.sign(
      { sub: userId, tokenVersion, role },
      {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn'),
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: userId, tokenVersion, role },
      {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      },
    );

    return { accessToken, refreshToken };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email },
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
    const code = Math.floor(100000 + Math.random() * 900000).toString();
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
    await this.emailService.sendPasswordResetCode(email, code, user.username);

    return {
      message: 'If the email exists, a password reset code has been sent',
    };
  }

  async verifyResetCode(verifyResetCodeDto: VerifyResetCodeDto) {
    const { email, code } = verifyResetCodeDto;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    // Find the latest active verification token for this user
    const verificationToken = await this.verificationTokenRepository.findOne({
      where: {
        user_id: user.id,
        type: 'password_reset',
        used_at: IsNull(),
      },
      order: { created_at: 'DESC' },
    });

    if (!verificationToken || verificationToken.expires_at <= new Date()) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const isValid = await bcrypt.compare(code, verificationToken.token_hash);
    if (!isValid) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    // Generate temporary token for password reset (expires in 10 minutes)
    const tempToken = this.jwtService.sign(
      { 
        sub: verificationToken.user_id, 
        type: 'password_reset',
        tokenId: verificationToken.id 
      },
      {
        secret: this.configService.get('jwt.secret'),
        expiresIn: '10m', // 10 minutes
      },
    );

    return {
      valid: true,
      token: tempToken,
      message: 'Code verified successfully. You can now reset your password.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;

    try {
      // Verify the temporary token
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('jwt.secret'),
      });

      if (payload.type !== 'password_reset') {
        throw new BadRequestException('Invalid reset token');
      }

      // Find the verification token
      const verificationToken = await this.verificationTokenRepository.findOne({
        where: { id: payload.tokenId },
      });

      if (!verificationToken || verificationToken.used_at) {
        throw new BadRequestException('Invalid or already used reset token');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(
        password,
        this.configService.get('bcrypt.rounds') || 12,
      );

      // Update user password
      const userAuth = await this.userAuthRepository.findOne({
        where: { user_id: verificationToken.user_id },
        select: ['user_id', 'password_hash', 'token_version'],
      });

      if (!userAuth) {
        throw new BadRequestException('User authentication not found');
      }

      userAuth.password_hash = hashedPassword;
      userAuth.token_version += 1; // Invalidate all existing sessions
      await this.userAuthRepository.save(userAuth);

      // Mark verification token as used
      verificationToken.used_at = new Date();
      await this.verificationTokenRepository.save(verificationToken);

      // Invalidate all existing sessions for this user
      await this.sessionRepository.delete({ user_id: verificationToken.user_id });

      return {
        message: 'Password reset successfully. Please login with your new password.',
      };
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new BadRequestException('Invalid or expired reset token');
      }
      throw error;
    }
  }

  async resendCode(resendCodeDto: ResendCodeDto) {
    const { email } = resendCodeDto;

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email },
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
    const code = Math.floor(100000 + Math.random() * 900000).toString();
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
    await this.emailService.sendPasswordResetCode(email, code, user.username);

    return {
      message: 'If the email exists, a new password reset code has been sent',
    };
  }
}
