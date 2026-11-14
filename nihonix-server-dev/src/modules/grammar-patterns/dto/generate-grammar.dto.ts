import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';

export class GenerateGrammarDto {
  @ApiProperty({ description: 'Grammar sub-topic slug để generate grammar patterns', example: 'basic-patterns-greetings' })
  @IsNotEmpty()
  @IsString()
  grammar_sub_topic_slug: string;

  @ApiProperty({ description: 'Level code (N5, N4, N3)', example: 'N5', required: false })
  @IsOptional()
  @IsString()
  level_code?: string;

  @ApiProperty({ description: 'Số lượng grammar patterns cần generate', example: 5, required: false, default: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  count?: number;

  @ApiProperty({ description: 'Prompt tùy chỉnh', required: false })
  @IsOptional()
  @IsString()
  custom_prompt?: string;
}

