import { IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserLevelDto {
  @ApiProperty({
    description: 'Level code for user (N5, N4, N3, N2, N1)',
    example: 'N3',
    enum: ['N5', 'N4', 'N3', 'N2', 'N1'],
  })
  @IsNotEmpty({ message: 'Level code is required' })
  @IsIn(['N5', 'N4', 'N3', 'N2', 'N1'], {
    message: 'Level code must be one of: N5, N4, N3, N2, N1',
  })
  level_code!: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
}
