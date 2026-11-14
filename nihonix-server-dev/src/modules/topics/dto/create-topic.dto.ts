import { IsNotEmpty, IsString, IsObject, IsOptional, IsInt, Min, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SanitizeSvg } from '@common/decorators/sanitize-svg.decorator';

export class CreateTopicDto {
  @ApiProperty({ description: 'Topic slug (unique identifier)' })
  @IsNotEmpty()
  @IsString()
  slug!: string;

  @ApiProperty({ description: 'Level code (N5, N4, N3, N2, N1)' })
  @IsNotEmpty()
  @IsString()
  level_code!: string;

  @ApiProperty({ 
    description: 'Topic title in multiple languages',
    example: { vi: 'Chào hỏi', en: 'Greetings', jp: '挨拶' }
  })
  @IsNotEmpty()
  @IsObject()
  title!: {
    vi: string;
    en: string;
    jp: string;
  };

  @ApiProperty({ 
    description: 'Icon SVG string (optional). You can paste SVG directly - it will be automatically sanitized.', 
    required: false,
    example: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>'
  })
  @IsOptional()
  @IsString()
  @SanitizeSvg()
  icon_svg?: string | null;

  @ApiProperty({ 
    description: 'Icon type: "material" for Material Icons or "svg" for custom SVG', 
    required: false,
    default: 'material',
    example: 'material'
  })
  @IsOptional()
  @IsString()
  icon_type?: string;

  @ApiProperty({ 
    description: 'Material Icon codepoint (decimal). Required if icon_type is "material"', 
    required: false,
    example: 58718
  })
  @IsOptional()
  @IsInt()
  icon_code?: number | null;

  @ApiProperty({ description: 'Display order (default: 1)', required: false, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}

