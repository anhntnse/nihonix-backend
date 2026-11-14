import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsInt, Min, IsUUID } from 'class-validator';

export class GenerateFlashcardsDto {
  @ApiProperty({ 
    description: 'Folder ID where the flashcard set will be created', 
    example: '9f43bb0f-4860-481b-a043-c96a70439cb8' 
  })
  @IsNotEmpty()
  @IsUUID()
  folder_id: string;

  @ApiProperty({ 
    description: 'Name of the flashcard set', 
    example: 'N5 Greetings Chapter 1' 
  })
  @IsNotEmpty()
  @IsString()
  set_name: string;

  @ApiProperty({ 
    description: 'Level code (N5, N4, N3, N2, N1)', 
    example: 'N5', 
    required: false 
  })
  @IsOptional()
  @IsString()
  level_code?: string;

  @ApiProperty({ 
    description: 'Difficulty level', 
    example: 'beginner', 
    enum: ['beginner', 'intermediate', 'advanced'],
    required: false 
  })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiProperty({ 
    description: 'Topic for flashcards', 
    example: 'greetings', 
    required: false 
  })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiProperty({ 
    description: 'Number of flashcards to generate', 
    example: 10, 
    default: 5,
    required: false 
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  count?: number;

  @ApiProperty({ 
    description: 'Custom prompt for AI generation', 
    required: false 
  })
  @IsOptional()
  @IsString()
  custom_prompt?: string;
}
