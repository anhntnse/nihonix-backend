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

export class CreateFlashcardDto {
  @ApiProperty({
    description: 'Folder ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  folder_id!: string;

  @ApiProperty({
    description: 'Card name/title (optional)',
    example: 'Hello - こんにちは',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

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
