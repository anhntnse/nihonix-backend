import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() @MinLength(3) @MaxLength(50)
  username?: string;

  @IsOptional() @IsString() @MaxLength(100)
  full_name?: string;
}
