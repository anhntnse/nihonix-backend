export class UserResponseDto {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  language: string;
  status: string;
  created_at: Date;
  updated_at: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
