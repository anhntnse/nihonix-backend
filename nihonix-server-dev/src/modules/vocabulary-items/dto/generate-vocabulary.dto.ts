import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';

export class GenerateVocabularyDto {
  @ApiProperty({ description: 'Topic ID (UUID) để generate vocabulary', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsNotEmpty()
  @IsString()
  topic_id: string;

  @ApiProperty({ description: 'Level code (N5, N4, N3)', example: 'N5', required: false })
  @IsOptional()
  @IsString()
  level_code?: string;

  @ApiProperty({ description: 'Số lượng từ vựng cần generate', example: 10, required: false, default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  count?: number;

  @ApiProperty({ description: 'Prompt tùy chỉnh', required: false })
  @IsOptional()
  @IsString()
  custom_prompt?: string;
}

