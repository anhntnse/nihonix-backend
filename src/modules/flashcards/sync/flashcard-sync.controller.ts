import {Controller,Post,Get,Body,Query,Request,UseGuards,HttpCode,ConflictException} from '@nestjs/common';
import {JwtAuthGuard} from '../../auth/guards/jwt-auth.guard';
import {FlashcardSyncService} from './flashcard-sync.service';
import {FlashcardBatchDto,FlashcardChangesDto} from './flashcard-sync.dto';
@Controller('flashcards/sync')
@UseGuards(JwtAuthGuard)
export class FlashcardSyncController {
  constructor(private readonly sync:FlashcardSyncService) {}
  private owner(req:any):string {
    const expected=req.headers['x-nihonix-account'];
    if(expected&&expected!==req.user.id)throw new ConflictException('Account changed before synchronization');
    return req.user.id;
  }
  @Post('batch') @HttpCode(200) batch(@Request() req,@Body() dto:FlashcardBatchDto) {return this.sync.batch(this.owner(req),dto.mutations);}
  @Get('changes') changes(@Request() req,@Query() dto:FlashcardChangesDto) {return this.sync.changes(this.owner(req),dto.after,dto.limit);}
}
