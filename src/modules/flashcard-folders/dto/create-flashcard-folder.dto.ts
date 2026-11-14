import { IsNotEmpty, IsString, IsOptional, IsInt, Min, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFlashcardFolderDto {
  @ApiProperty({ description: 'Folder name', example: 'Family Words' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ description: 'Folder description (optional)', example: 'Flashcards for family-related vocabulary', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ description: 'Display order (default: 1)', required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}
