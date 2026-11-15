import {IsUUID,IsInt,IsOptional,Min,Max} from 'class-validator';
export class GenerateFillBlankDto{
 @IsOptional() @IsUUID() request_id?:string;
 @IsUUID() topic_id:string;
 @IsOptional() @IsInt() @Min(1) @Max(15) exercise_count?:number;
}
