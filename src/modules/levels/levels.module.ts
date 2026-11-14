import { CatalogService } from './catalog.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Level } from './entity/level.entity';
import { LevelsService } from './levels.service';
import { LevelsController } from './levels.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Level])],
  controllers: [LevelsController],
  providers: [LevelsService, CatalogService],
  exports: [LevelsService, CatalogService],
})
export class LevelsModule {}

