import {IsUUID,IsIn,IsInt,Min,Max,IsISO8601,IsTimeZone,IsOptional,IsString,MaxLength,ArrayMinSize,ArrayMaxSize,ValidateNested,IsArray} from 'class-validator';
import {Type} from 'class-transformer';
export class RecordActivityDto{
 @IsUUID()id:string;
 @IsIn(['vocabulary','grammar','flashcards','practice'])activity_type:string;
 @IsInt()@Min(1)@Max(300)duration_seconds:number;
 @IsISO8601({strict:true})occurred_at:string;
 @IsTimeZone()timezone:string;
 @IsOptional()@IsString()@MaxLength(255)item_id?:string;
}
export class ActivityBatchDto{
 @IsArray()@ArrayMinSize(1)@ArrayMaxSize(50)@ValidateNested({each:true})@Type(()=>RecordActivityDto)events:RecordActivityDto[];
}
