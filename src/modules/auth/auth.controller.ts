import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Headers,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';

import { AuthService } from '@auth/auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, LogoutDto, ForgotPasswordDto, VerifyResetCodeDto, ResetPasswordDto, ResendCodeDto } from '@auth/dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import { AuthThrottleGuard } from './guards/auth-throttle.guard';
import { EmailVerificationService } from './services/email-verification.service';
import { VerifyEmailDto, RequestEmailVerificationDto } from './dto/email-verification.dto';

@ApiTags('Authentication')
@UseGuards(AuthThrottleGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly verification: EmailVerificationService) {}

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() dto: VerifyEmailDto) { return this.verification.verify(dto.email, dto.code); }

  @Post('request-email-verification')
  @HttpCode(HttpStatus.OK)
  requestVerification(@Body() dto: RequestEmailVerificationDto, @Request() req) {
    return this.verification.request(dto.email, req.res?.getHeader('X-Request-Id'));
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user account' })
  @ApiCreatedResponse({ description: 'User registered successfully' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with credentials' })
  @ApiOkResponse({ description: 'Login successful' })
  async login(
    @Body() loginDto: LoginDto,
    @Headers('user-agent') userAgent: string,
    @Ip() ip: string,
  ) {
    return this.authService.login(loginDto, userAgent || 'unknown', ip);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiOkResponse({ description: 'Token refreshed' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiOkResponse({ description: 'Logged out successfully' })
  async logout(@Request() req, @Body() logoutDto: LogoutDto) {
    return this.authService.logout(req.user.id, logoutDto.refreshToken, req.user.session_id);
  }

  @Post('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ description: 'User profile retrieved' })
  async getProfile(@Request() req) {
    return this.authService.getCurrentUser(req.user.id);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset code' })
  @ApiOkResponse({ description: 'Password reset code sent if email exists' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('verify-reset-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify password reset code (Step 1)' })
  @ApiOkResponse({ description: 'Code verified successfully' })
  async verifyResetCode(@Body() verifyResetCodeDto: VerifyResetCodeDto) {
    return this.authService.verifyResetCode(verifyResetCodeDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token (Step 2)' })
  @ApiOkResponse({ description: 'Password reset successfully' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Post('resend-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend password reset code' })
  @ApiOkResponse({ description: 'New password reset code sent if email exists' })
  async resendCode(@Body() resendCodeDto: ResendCodeDto) {
    return this.authService.resendCode(resendCodeDto);
  }
}
