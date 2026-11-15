import {Controller,Put,Delete,Body,Param,Request,ParseUUIDPipe,UseGuards,ConflictException} from '@nestjs/common';
import {IsString,Length,IsBoolean} from 'class-validator';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {NotificationsService} from './notifications.service';
class DeviceDto{@IsString()@Length(20,4096)token:string;@IsBoolean()enabled:boolean;}
@Controller('devices')@UseGuards(JwtAuthGuard)
export class NotificationsController{
 constructor(private readonly service:NotificationsService){}
 private owner(req:any){if(req.headers['x-nihonix-account']&&req.headers['x-nihonix-account']!==req.user.id)throw new ConflictException('Account changed');return req.user.id;}
 @Put(':id')register(@Request()req:any,@Param('id',ParseUUIDPipe)id:string,@Body()dto:DeviceDto){return this.service.register(this.owner(req),req.user.session_id,id,dto.token,dto.enabled);}
 @Delete(':id')remove(@Request()req:any,@Param('id',ParseUUIDPipe)id:string){return this.service.remove(this.owner(req),req.user.session_id,id);}
}
