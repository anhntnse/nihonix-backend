import {Controller,Get,Post,Body,Query,UseGuards,HttpCode,Request,ConflictException} from '@nestjs/common';
import {ApiTags,ApiBearerAuth} from '@nestjs/swagger';
import {JwtAuthGuard} from '@auth/guards/jwt-auth.guard';
import {LearningStreaksService} from './learning-streaks.service';
import {RecordActivityDto,ActivityBatchDto} from './dto/record-activity.dto';
import {CalendarQueryDto} from './dto/calendar-query.dto';
@ApiTags('Learning Streaks')@ApiBearerAuth()@Controller('learning-streaks')@UseGuards(JwtAuthGuard)
export class LearningStreaksController{
 constructor(private readonly service:LearningStreaksService){}
 private owner(req:any){if(req.headers['x-nihonix-account']&&req.headers['x-nihonix-account']!==req.user.id)throw new ConflictException('Account changed');return req.user.id;}
 @Get()getStreak(@Request()req:any){return this.service.getStreak(this.owner(req));}
 @Post('activities/batch')@HttpCode(200)batch(@Request()req:any,@Body()dto:ActivityBatchDto){return this.service.recordBatch(this.owner(req),dto.events);}
 @Post('activity')@HttpCode(200)activity(@Request()req:any,@Body()dto:RecordActivityDto){return this.service.recordBatch(this.owner(req),[dto]);}
 @Get('calendar')calendar(@Request()req:any,@Query()q:CalendarQueryDto){return this.service.getCalendar(this.owner(req),q.year,q.month);}
}
