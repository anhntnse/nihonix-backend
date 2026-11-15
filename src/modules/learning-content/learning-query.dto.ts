import { Type, Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export const contentKinds = ['vocabulary-items','vocabulary-sets','grammar-sub-topics','grammar-patterns'] as const;
export type ContentKind = typeof contentKinds[number];
export class LearningQueryDto {
  @IsOptional() @IsString() @MaxLength(120)
  @Transform(({value}) => typeof value === 'string' ? value.trim() : value)
  q?: string;
  @IsOptional() @IsUUID() topic_id?: string;
  @IsOptional() @IsIn(['N5','N4','N3','N2','N1']) level_code?: string;
  @IsOptional() @IsUUID() set_id?: string;
  @IsOptional() @IsString() @MaxLength(200) sub_topic_slug?: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(10000) page = 1;
  @Type(() => Number) @IsInt() @Min(1) @Max(100) page_size = 20;
}
