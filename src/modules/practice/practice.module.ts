import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PracticeSession } from './entity/practice-session.entity';
import { PracticeExercise } from './entity/practice-exercise.entity';
import { Topic } from '@topics/entity/topic.entity';
import { VocabularyItem } from '@vocabulary-items/entity/vocabulary-item.entity';
import { GrammarPattern } from '@grammar-patterns/entity/grammar-pattern.entity';
import { PracticeController } from './practice.controller';
import { PracticeService } from './practice.service';
import { AiModule } from '@ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PracticeSession,
      PracticeExercise,
      Topic,
      VocabularyItem,
      GrammarPattern,
    ]),
    AiModule,
  ],
  controllers: [PracticeController],
  providers: [PracticeService],
  exports: [PracticeService],
})
export class PracticeModule {}


