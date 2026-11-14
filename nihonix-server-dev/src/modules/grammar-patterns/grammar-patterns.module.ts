import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GrammarPattern } from './entity/grammar-pattern.entity';
import { GrammarSubTopic } from '@grammar-sub-topics/entity/grammar-sub-topic.entity';
import { GrammarPatternsController } from './grammar-patterns.controller';
import { GrammarPatternsService } from './services/grammar-patterns.service';
import { AiModule } from '@ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GrammarPattern, GrammarSubTopic]),
    AiModule,
  ],
  controllers: [GrammarPatternsController],
  providers: [GrammarPatternsService],
  exports: [GrammarPatternsService],
})
export class GrammarPatternsModule {}

