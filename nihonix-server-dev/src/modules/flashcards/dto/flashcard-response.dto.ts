import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for flashcard (excludes set_id field to avoid duplication)
 */
export class FlashcardResponseDto {
  @ApiProperty({ example: 'e9b2fd61-8f71-4300-a9fc-1484948630a1' })
  @Expose()
  id!: string;

  @ApiProperty({ example: null })
  @Expose()
  slug!: string | null;

  @ApiProperty({ example: 'b6916a86-1d89-4b32-a08b-0fa2d94453b9' })
  @Expose()
  folder_id!: string;

  @Exclude()
  set_id!: string;

  @ApiProperty({ example: { text: 'こんにちは', type: 'text' } })
  @Expose()
  front!: any;

  @ApiProperty({ example: { text: 'Hello', meaning: 'A greeting', type: 'text' } })
  @Expose()
  back!: any;

  @ApiProperty({ example: 1 })
  @Expose()
  order!: number;

  @ApiProperty({ example: '2025-11-12T05:47:48.244Z' })
  @Expose()
  created_at!: Date;

  @ApiProperty({ example: '2025-11-12T05:47:48.244Z' })
  @Expose()
  updated_at!: Date;
}

/**
 * Bulk create response
 */
export class BulkCreateResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  set_id!: string;

  @ApiProperty({ example: 'Du lịch - Travel vocabulary' })
  set_name!: string;

  @ApiProperty({ example: 2 })
  created!: number;

  @ApiProperty({ type: [FlashcardResponseDto] })
  cards!: FlashcardResponseDto[];
}

/**
 * Bulk update response
 */
export class BulkUpdateResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  set_id!: string;

  @ApiProperty({ example: 'Du lịch - Travel vocabulary' })
  set_name!: string;

  @ApiProperty({ example: 1 })
  created!: number;

  @ApiProperty({ example: 2 })
  updated!: number;

  @ApiProperty({ example: 1 })
  deleted!: number;

  @ApiProperty({ type: [FlashcardResponseDto] })
  cards!: FlashcardResponseDto[];
}
