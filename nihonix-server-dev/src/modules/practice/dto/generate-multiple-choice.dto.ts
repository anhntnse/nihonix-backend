import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsInt, Min, Max, IsOptional } from 'class-validator';

export class GenerateMultipleChoiceDto {
  @ApiProperty({ description: 'Topic ID (UUID)', example: '2821dca6-1d84-4b6f-88ca-4aab33dc0ba5' })
  @IsNotEmpty()
  @IsUUID()
  topic_id!: string;

  @ApiProperty({ description: 'Số lượng bài trắc nghiệm', example: 10, default: 10 })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(30)
  exercise_count?: number;
}


