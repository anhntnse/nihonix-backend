import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config'

import { User } from '@users/entity/user.entity';
import { UserAuth } from '@auth/entity/user-auth.entity';
import { Session } from '@auth/entity/session.entity';
import { VerificationToken } from '@auth/entity/verification-token.entity';
import { JwtStrategy } from '@auth/strategies/jwt.strategy';
import { AuthService } from '@auth/auth.service';
import { AuthController } from '@auth/auth.controller';
import { EmailService } from '@auth/services/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserAuth, Session, VerificationToken]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, EmailService],
  exports: [AuthService],
})
export class AuthModule {}
