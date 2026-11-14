import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, Min } from 'class-validator';

export class RecordActivityDto {
  @ApiProperty({
    description: 'Loại hoạt động học',
    example: 'flashcard',
    enum: ['flashcard', 'vocabulary', 'grammar', 'lesson'],
  })
  @IsNotEmpty()
  @IsString()
  activity_type!: string;

  @ApiProperty({
    description: 'Số lượng hoạt động (optional)',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  activity_count?: number;
}

