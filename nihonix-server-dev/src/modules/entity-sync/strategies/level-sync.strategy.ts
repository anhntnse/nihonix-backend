import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityKind } from '../entity/entity-sync.entity';
import { BaseSyncStrategy } from './base-sync.strategy';
import { EtagService } from '../services/etag.service';
import { Level } from '@levels/entity/level.entity';
import { EntitySync } from '../entity/entity-sync.entity';

@Injectable()
export class LevelSyncStrategy extends BaseSyncStrategy {
  entityKind = EntityKind.LEVEL;
  
  constructor(
    @InjectRepository(Level)
    private levelRepository: Repository<Level>,
    @InjectRepository(EntitySync)
    entitySyncRepository: Repository<EntitySync>,
    etagService: EtagService,
  ) {
    super(etagService, entitySyncRepository);
  }
  
  async findAll(filters?: any): Promise<Level[]> {
    // Levels don't have filters yet, but keep for future extensibility
    return this.levelRepository.find({
      order: { code: 'ASC' },
    });
  }
  
  async findOne(entityKey: string): Promise<Level> {
    const level = await this.levelRepository.findOne({
      where: { code: entityKey as 'N5' | 'N4' | 'N3' | 'N2' | 'N1' },
    });
    
    if (!level) {
      throw new Error(`Level with code ${entityKey} not found`);
    }
    
    return level;
  }
  
  getEntityKey(entity: Level): string {
    return entity.code;
  }
}

