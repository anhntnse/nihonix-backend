import {FlashcardSyncModule} from '../flashcards/sync/flashcard-sync.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashcardFolder } from './entity/flashcard-folder.entity';
import { FlashcardFoldersService } from './services/flashcard-folders.service';
import { FlashcardFoldersController } from './flashcard-folders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FlashcardFolder]), FlashcardSyncModule],
  controllers: [FlashcardFoldersController],
  providers: [FlashcardFoldersService],
  exports: [FlashcardFoldersService],
})
export class FlashcardFoldersModule {}

