import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GrammarSubTopic } from './entity/grammar-sub-topic.entity';
import { GrammarSubTopicsService } from './services/grammar-sub-topics.service';
import { GrammarSubTopicsController } from './grammar-sub-topics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GrammarSubTopic])],
  controllers: [GrammarSubTopicsController],
  providers: [GrammarSubTopicsService],
  exports: [GrammarSubTopicsService],
})
export class GrammarSubTopicsModule {}

