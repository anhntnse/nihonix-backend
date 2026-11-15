import {IsString,IsOptional,IsInt,Min,Max,IsUUID,IsIn,MaxLength,Matches} from 'class-validator';
export class GenerateFlashcardsDto{
 @IsOptional() @IsUUID() request_id?:string;
 @IsUUID() folder_id:string;
 @IsString() @Matches(/\S/) @MaxLength(255) set_name:string;
 @IsOptional() @IsIn(['N5','N4','N3','N2','N1']) level_code?:string;
 @IsOptional() @IsIn(['beginner','intermediate','advanced']) difficulty?:string;
 @IsOptional() @IsString() @MaxLength(500) topic?:string;
 @IsOptional() @IsInt() @Min(1) @Max(15) count?:number;
 @IsOptional() @IsString() @MaxLength(2000) custom_prompt?:string;
}
