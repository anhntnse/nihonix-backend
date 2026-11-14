import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsUUID,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFlashcardSetDto {
  @ApiProperty({
    description: 'Folder ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  folder_id!: string;

  @ApiProperty({ description: 'Set name', example: 'Du lịch - Travel' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

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
