import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsISO8601, IsOptional, IsString, IsUUID, MaxLength, Matches, ValidateNested, IsInt, Min, Max } from 'class-validator';
export class ProgressMutationDto {
  @IsUUID() mutation_id:string;
  @IsIn(['vocabulary','grammar']) item_type:string;
  @IsString() @MaxLength(300) @Matches(/\S/) item_id:string;
  @IsIn(['learned','not_learned']) status:string;
  @IsISO8601({strict:true}) client_updated_at:string;
}
export class ProgressBatchDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(50) @ValidateNested({each:true}) @Type(()=>ProgressMutationDto)
  mutations:ProgressMutationDto[];
}
export class ProgressChangesDto {
  @IsString() @Matches(/^\d{1,18}$/) after='0';
  @Type(()=>Number) @IsInt() @Min(1) @Max(100) limit=100;
}
