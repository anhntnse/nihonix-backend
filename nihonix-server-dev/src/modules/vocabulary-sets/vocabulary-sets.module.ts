import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VocabularySet } from './entity/vocabulary-set.entity';
import { Topic } from '@topics/entity/topic.entity';
import { VocabularySetsService } from './vocabulary-sets.service';
import { VocabularySetsController } from './vocabulary-sets.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VocabularySet, Topic])],
  controllers: [VocabularySetsController],
  providers: [VocabularySetsService],
  exports: [VocabularySetsService],
})
export class VocabularySetsModule {}

