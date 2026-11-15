import {Controller,Post,Get,Body,Request,Param,Query,UseGuards,HttpCode,ParseUUIDPipe,ConflictException} from '@nestjs/common';
import {Type} from 'class-transformer';
import {IsOptional,IsIn,IsUUID,IsInt,Min,Max} from 'class-validator';
import {PracticeService} from './practice.service';
import {GenerateFillBlankDto,GenerateMultipleChoiceDto,SubmitPracticeDto} from './dto';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
class PracticeQuery{
 @IsOptional() @IsUUID() topic_id?:string;
 @IsOptional() @IsIn(['fill_blank','multiple_choice']) exercise_type?:string;
 @IsOptional() @IsIn(['in_progress','completed']) status?:string;
 @IsOptional() @Type(()=>Number) @IsInt() @Min(1) @Max(10000) page=1;
 @IsOptional() @Type(()=>Number) @IsInt() @Min(1) @Max(50) page_size=20;
}
@Controller('practice') @UseGuards(JwtAuthGuard)
export class PracticeController{
 constructor(private readonly service:PracticeService){}
 private owner(req:any){if(req.headers['x-nihonix-account']&&req.headers['x-nihonix-account']!==req.user.id)throw new ConflictException('Account changed before practice request');return req.user.id;}
 @Post('fill-blank') fill(@Body() dto:GenerateFillBlankDto,@Request() req){return this.service.generateFillBlank(dto,this.owner(req));}
 @Post('multiple-choice') choice(@Body() dto:GenerateMultipleChoiceDto,@Request() req){return this.service.generateMultipleChoice(dto,this.owner(req));}
 @Get('sets') list(@Query() q:PracticeQuery,@Request() req){return this.service.getPracticeSets(this.owner(req),q.topic_id,q.exercise_type,q.status,q.page,q.page_size);}
 @Get('sets/:id') detail(@Param('id',ParseUUIDPipe) id:string,@Request() req){return this.service.getPracticeSetById(id,this.owner(req));}
 @Post('submit') @HttpCode(200) submit(@Body() dto:SubmitPracticeDto,@Request() req){return this.service.submitPractice(dto,this.owner(req));}
}
