import {Type} from 'class-transformer';
import {IsUUID,IsString,IsIn,IsOptional,IsArray,ValidateNested,ArrayMaxSize,ArrayMinSize,MaxLength,IsInt,Min,Max,Matches} from 'class-validator';
export class FlashcardFaceDto {
  @IsString() @MaxLength(4000) @Matches(/\S/) text:string;
  @IsOptional() @IsIn(['text']) type?:string;
  @IsOptional() @IsString() @MaxLength(4000) meaning?:string;
}
export class SyncCardDto {
  @IsUUID() id:string;
  @ValidateNested() @Type(()=>FlashcardFaceDto) front:FlashcardFaceDto;
  @ValidateNested() @Type(()=>FlashcardFaceDto) back:FlashcardFaceDto;
  @IsOptional() @IsInt() @Min(1) @Max(1000000) order?:number;
}
export class FlashcardMutationDto {
  @IsUUID() mutation_id:string;
  @IsIn(['folder','set']) kind:string;
  @IsUUID() id:string;
  @IsIn(['upsert','delete']) action:string;
  @IsString() @Matches(/^\d{1,18}$/) base_version:string;
  @IsOptional() @IsUUID() depends_on?:string;
  @IsOptional() @IsString() @MaxLength(255) name?:string;
  @IsOptional() @IsString() @MaxLength(1000) description?:string;
  @IsOptional() @IsInt() @Min(1) @Max(1000000) order?:number;
  @IsOptional() @IsUUID() folder_id?:string;
  @IsOptional() @IsArray() @ArrayMaxSize(200) @ValidateNested({each:true}) @Type(()=>SyncCardDto) cards?:SyncCardDto[];
}
export class FlashcardBatchDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(20) @ValidateNested({each:true}) @Type(()=>FlashcardMutationDto) mutations:FlashcardMutationDto[];
}
export class FlashcardChangesDto {
  @IsString() @Matches(/^\d{1,18}$/) after='0';
  @Type(()=>Number) @IsInt() @Min(1) @Max(100) limit=100;
}
