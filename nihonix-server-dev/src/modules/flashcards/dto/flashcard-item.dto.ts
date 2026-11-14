import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsInt,
  Min,
  IsUUID,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FlashcardItemDto {
  @ApiProperty({
    description:
      'Card ID (UUID) - present for existing cards, omit for new cards',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({
    description: 'Front side of flashcard',
    example: { text: 'こんにちは', type: 'text' },
  })
  @IsNotEmpty()
  @IsObject()
  front!: Record<string, any>;

  @ApiProperty({
    description: 'Back side of flashcard',
    example: { text: 'Hello', meaning: 'A greeting', type: 'text' },
  })
  @IsNotEmpty()
  @IsObject()
  back!: Record<string, any>;

  @ApiProperty({
    description: 'Display order (default: 1)',
    required: false,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}
