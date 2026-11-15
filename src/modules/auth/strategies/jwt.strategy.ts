import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '@auth/auth.service';

export interface JwtPayload {
  sub: string;
  tokenVersion: number;
  role?: string;
  token_use?: string;
  sid?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private authService: AuthService,
  ) {
    const jwtSecret = configService.get<string>('jwt.secret');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.token_use !== 'access' || !payload.sid) throw new UnauthorizedException('Invalid access token');
    const user = await this.authService.validateUser(payload.sub, payload.tokenVersion, payload.sid);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {...user,session_id:payload.sid};
  }
}
