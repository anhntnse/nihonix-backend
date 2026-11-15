import {IsUUID,IsArray,ArrayMinSize,ArrayMaxSize,ValidateNested,IsDefined,IsOptional,IsInt,Min,Max} from 'class-validator';
import {Type} from 'class-transformer';
export class ExerciseAnswerDto{
 @IsUUID() exercise_id:string;
 @IsDefined() user_answer:any;
 @IsOptional() @IsInt() @Min(0) @Max(3600) time_spent?:number;
}
export class SubmitPracticeDto{
 @IsOptional() @IsUUID() request_id?:string;
 @IsUUID() session_id:string;
 @IsArray() @ArrayMinSize(1) @ArrayMaxSize(15) @ValidateNested({each:true}) @Type(()=>ExerciseAnswerDto) answers:ExerciseAnswerDto[];
}
