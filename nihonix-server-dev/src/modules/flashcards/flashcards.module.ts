import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Flashcard } from './entity/flashcard.entity';
import { FlashcardSet } from './entity/flashcard-set.entity';
import { FlashcardFolder } from '@flashcard-folders/entity/flashcard-folder.entity';
import { FlashcardsService } from './services/flashcards.service';
import { FlashcardsController } from './flashcards.controller';
import { AiModule } from '@ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Flashcard, FlashcardSet, FlashcardFolder]),
    AiModule,
  ],
  controllers: [FlashcardsController],
  providers: [FlashcardsService],
  exports: [FlashcardsService],
})
export class FlashcardsModule {}

