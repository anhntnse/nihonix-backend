import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ExerciseAnswerDto {
  @ApiProperty({ description: 'Exercise ID', example: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  exercise_id!: string;

  @ApiProperty({ description: 'User answer', example: 1 })
  @IsNotEmpty()
  user_answer!: any;

  @ApiProperty({ description: 'Time spent (seconds)', example: 5.5 })
  @IsOptional()
  @IsNumber()
  time_spent?: number;
}

export class SubmitPracticeDto {
  @ApiProperty({ description: 'Practice session ID', example: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  session_id!: string;

  @ApiProperty({ description: 'User answers', type: [ExerciseAnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseAnswerDto)
  answers!: ExerciseAnswerDto[];
}


