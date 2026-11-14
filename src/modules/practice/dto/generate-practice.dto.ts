import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsInt, Min, Max, IsOptional, IsArray, IsEnum } from 'class-validator';

export enum ExerciseType {
  FILL_BLANK = 'fill_blank',
  MULTIPLE_CHOICE = 'multiple_choice',
  TRANSLATION = 'translation',
  SENTENCE_ORDER = 'sentence_order',
}

export class GeneratePracticeDto {
  @ApiProperty({ description: 'Topic ID (UUID)', example: '2821dca6-1d84-4b6f-88ca-4aab33dc0ba5' })
  @IsNotEmpty()
  @IsUUID()
  topic_id!: string;

  @ApiProperty({ description: 'Số lượng bài tập', example: 10, default: 10 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(30)
  exercise_count?: number;

  @ApiProperty({ 
    description: 'Loại bài tập', 
    example: ['fill_blank', 'multiple_choice'],
    enum: ExerciseType,
    isArray: true,
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ExerciseType, { each: true })
  types?: ExerciseType[];
}


