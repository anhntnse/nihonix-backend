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
 * DTO for bulk updating flashcards
 * - Cards with id will be updated
 * - Cards without id will be created
 * - Existing cards not in array will be deleted
 */
export class BulkUpdateFlashcardsDto {
  @ApiProperty({
    description: 'Set ID (UUID) - the flashcard set to update',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  set_id!: string;

  @ApiProperty({
    description: 'Update set name (optional)',
    example: 'Du lịch - Travel vocabulary (updated)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  set_name?: string;

  @ApiProperty({
    description:
      'Array of flashcards (with id = update, without id = create, existing cards not in array = delete)',
    type: [FlashcardItemDto],
    example: [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        front: { text: 'こんにちは！', type: 'text' },
        back: { text: 'Hello!', type: 'text' },
        order: 1,
      },
      {
        front: { text: 'さようなら', type: 'text' },
        back: { text: 'Goodbye', type: 'text' },
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
