import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VocabularyItem } from './entity/vocabulary-item.entity';
import { VocabularySet } from '@vocabulary-sets/entity/vocabulary-set.entity';
import { Topic } from '@topics/entity/topic.entity';
import { VocabularyItemsController } from './vocabulary-items.controller';
import { VocabularyItemsService } from './services/vocabulary-items.service';
import { AiModule } from '@ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([VocabularyItem, VocabularySet, Topic]),
    AiModule,
  ],
  controllers: [VocabularyItemsController],
  providers: [VocabularyItemsService],
  exports: [VocabularyItemsService],
})
export class VocabularyItemsModule {}

