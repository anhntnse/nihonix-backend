import { IsEmail, Matches } from 'class-validator';

export class RequestEmailVerificationDto {
  @IsEmail()
  email: string;
}

export class VerifyEmailDto extends RequestEmailVerificationDto {
  @Matches(/^\d{6}$/, { message: 'Enter the 6-digit verification code' })
  code: string;
}
