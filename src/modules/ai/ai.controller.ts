import {Controller,Get,Post,HttpCode,Request,Param,UseGuards,ParseUUIDPipe,ConflictException} from '@nestjs/common';
import {AiService} from './services/ai.service';
import {AiRequestService} from './ai-request.service';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
@Controller('ai')
export class AiController{
 constructor(private readonly service:AiService,private readonly requests:AiRequestService){}
 private owner(req:any){
  if(req.headers['x-nihonix-account']&&req.headers['x-nihonix-account']!==req.user.id)throw new ConflictException('Account changed before AI request');
  return req.user.id;
 }
 // Public liveness only; provider readiness is exposed through authenticated quota.
 @Get('health') health(){return {status:'ok'};}
 @Get('quota') @UseGuards(JwtAuthGuard)
 async quota(@Request() req){return {...await this.requests.quota(this.owner(req)),provider:await this.service.healthCheck()};}
 @Get('requests/:id') @UseGuards(JwtAuthGuard)
 status(@Request() req,@Param('id',ParseUUIDPipe) id:string){return this.requests.status(this.owner(req),id);}
 @Post('requests/:id/cancel') @UseGuards(JwtAuthGuard) @HttpCode(200)
 cancel(@Request() req,@Param('id',ParseUUIDPipe) id:string){return this.requests.cancel(this.owner(req),id);}
}
