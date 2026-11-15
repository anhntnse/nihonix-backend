import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningProgress, ProgressReceipt } from './progress.entity';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';
@Module({imports:[TypeOrmModule.forFeature([LearningProgress,ProgressReceipt])],controllers:[ProgressController],providers:[ProgressService]})
export class ProgressModule {}
