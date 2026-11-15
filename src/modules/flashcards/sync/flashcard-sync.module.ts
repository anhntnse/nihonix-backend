import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {FlashcardSyncHead,FlashcardSyncReceipt} from './flashcard-sync.entity';
import {FlashcardSyncService} from './flashcard-sync.service';
import {FlashcardSyncController} from './flashcard-sync.controller';
@Module({imports:[TypeOrmModule.forFeature([FlashcardSyncHead,FlashcardSyncReceipt])],
  providers:[FlashcardSyncService],controllers:[FlashcardSyncController],exports:[FlashcardSyncService]})
export class FlashcardSyncModule {}
