import {
  IsNotEmpty,
  IsUUID,
  IsArray,
  ValidateNested,
  IsString,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { FlashcardItemDto } from './flashcard-item.dto';

/**
 * DTO for bulk creating flashcards
 */
export class BulkCreateFlashcardsDto {
  @ApiProperty({
    description: 'Folder ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  folder_id!: string;

  @ApiProperty({
    description: 'Name for the flashcard set',
    example: 'Du lịch - Travel vocabulary',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  set_name!: string;

  @ApiProperty({
    description: 'Array of flashcards to create',
    type: [FlashcardItemDto],
    example: [
      {
        front: { text: 'こんにちは', type: 'text' },
        back: { text: 'Hello', meaning: 'A greeting', type: 'text' },
        order: 1,
      },
      {
        front: { text: 'ありがとう', type: 'text' },
        back: { text: 'Thank you', type: 'text' },
        order: 2,
      },
    ],
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlashcardItemDto)
  cards!: FlashcardItemDto[];
}
