import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningStreaksController } from './learning-streaks.controller';
import { LearningStreaksService } from './learning-streaks.service';
import { UserLearningStreak, UserLearningActivity } from './entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserLearningStreak, UserLearningActivity]),
  ],
  controllers: [LearningStreaksController],
  providers: [LearningStreaksService],
  exports: [LearningStreaksService],
})
export class LearningStreaksModule {}

