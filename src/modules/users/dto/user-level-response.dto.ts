import { ApiProperty } from '@nestjs/swagger';
import { Level } from '@levels/entity/level.entity';

export class UserLevelResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  user_id: string;

  @ApiProperty({
    description: 'Current level code',
    example: 'N5',
    nullable: true,
  })
  level_code: string | null;

  @ApiProperty({
    description: 'Level details',
    type: () => Level,
    nullable: true,
  })
  level: Level | null;
}

