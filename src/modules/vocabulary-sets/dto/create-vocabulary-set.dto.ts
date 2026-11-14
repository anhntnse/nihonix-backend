import { IsNotEmpty, IsString, IsObject, IsOptional, IsInt, Min, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVocabularySetDto {
  @ApiProperty({ description: 'Topic ID (UUID)', example: '2821dca6-1d84-4b6f-88ca-4aab33dc0ba5' })
  @IsNotEmpty()
  @IsUUID()
  topic_id!: string;

  @ApiProperty({ 
    description: 'Set title in multiple languages',
    example: { vi: 'Lời chào cơ bản', en: 'Basic Greetings', jp: '基本的な挨拶' }
  })
  @IsNotEmpty()
  @IsObject()
  title!: {
    vi: string;
    en: string;
    jp: string;
  };

  @ApiProperty({ description: 'Set description (optional)', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Display order (default: 1)', required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}

