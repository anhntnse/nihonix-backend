import { Module } from '@nestjs/common';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntitySync } from './entity/entity-sync.entity';
import { EntitySyncService } from './services/entity-sync.service';
import { EntitySyncController } from './entity-sync.controller';
import { EtagService } from './services/etag.service';
import { TopicSyncStrategy } from './strategies/topic-sync.strategy';
import { LevelSyncStrategy } from './strategies/level-sync.strategy';
import { Topic } from '@topics/entity/topic.entity';
import { Level } from '@levels/entity/level.entity';
import { ISyncStrategy } from './interfaces/sync-strategy.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([EntitySync, Topic, Level]),
  ],
  controllers: [EntitySyncController],
  providers: [
    EtagService,
    TopicSyncStrategy,
    LevelSyncStrategy,
    {
      provide: EntitySyncService,
      useFactory: (
        topicStrategy: TopicSyncStrategy,
        levelStrategy: LevelSyncStrategy,
        entitySyncRepository: Repository<EntitySync>,
        etagService: EtagService,
      ) => {
        const strategies: ISyncStrategy[] = [topicStrategy, levelStrategy];
        return new EntitySyncService(strategies, entitySyncRepository, etagService);
      },
      inject: [
        TopicSyncStrategy,
        LevelSyncStrategy,
        getRepositoryToken(EntitySync),
        EtagService,
      ],
    },
  ],
  exports: [EntitySyncService, EtagService],
})
export class EntitySyncModule {}

