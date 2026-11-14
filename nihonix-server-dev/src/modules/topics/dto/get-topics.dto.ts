import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetTopicsDto {
  @ApiPropertyOptional({
    description: 'Filter by level code',
    enum: ['N5', 'N4', 'N3', 'N2', 'N1'],
    example: 'N5',
  })
  @IsOptional()
  @IsIn(['N5', 'N4', 'N3', 'N2', 'N1'], {
    message: 'Level code must be one of: N5, N4, N3, N2, N1',
  })
  levelCode?: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
}

