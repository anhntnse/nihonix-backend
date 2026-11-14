import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Level } from '@levels/entity/level.entity';
import { Topic } from '@topics/entity/topic.entity';
import { GrammarSubTopic } from '@grammar-sub-topics/entity/grammar-sub-topic.entity';
import { VocabularyItem } from '@vocabulary-items/entity/vocabulary-item.entity';
import { GrammarPattern } from '@grammar-patterns/entity/grammar-pattern.entity';
import { VocabularySet } from '@vocabulary-sets/entity/vocabulary-set.entity';
import { SeedService } from './seed.service';
import { EntitySyncModule } from '@entity-sync/entity-sync.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Level,
      Topic,
      GrammarSubTopic,
      VocabularyItem,
      GrammarPattern,
      VocabularySet,
    ]),
    EntitySyncModule,
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}

