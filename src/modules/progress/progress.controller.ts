import { Body, Controller, Get, Post, Query, Request, UseGuards, HttpCode, ConflictException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProgressBatchDto, ProgressChangesDto } from './progress.dto';
import { ProgressService } from './progress.service';
@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progress:ProgressService) {}
  private owner(req:any):string {
    const expected=req.headers['x-nihonix-account'];
    if(expected && expected!==req.user.id) throw new ConflictException('Account changed before synchronization');
    return req.user.id;
  }
  @Post('batch') @HttpCode(200) batch(@Request() req,@Body() dto:ProgressBatchDto) { return this.progress.batch(this.owner(req),dto); }
  @Get('changes') changes(@Request() req,@Query() query:ProgressChangesDto) { return this.progress.changes(this.owner(req),query); }
  @Get('summary') summary(@Request() req) { return this.progress.summary(this.owner(req)); }
}
