import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Topic } from './entity/topic.entity';
import { TopicsService } from './services/topics.service';
import { TopicsController } from './topics.controller';
import { Level } from '@levels/entity/level.entity';
import { SeedModule } from '@services/seed/seed.module';
import { EntitySyncModule } from '@entity-sync/entity-sync.module';
import { EntitySync } from '@entity-sync/entity/entity-sync.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Topic, Level, EntitySync]), 
    SeedModule,
    EntitySyncModule, // Import để dùng EntitySyncService và EtagService
  ],
  controllers: [TopicsController],
  providers: [TopicsService],
  exports: [TopicsService],
})
export class TopicsModule {}

