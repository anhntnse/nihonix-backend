import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityKind } from '../entity/entity-sync.entity';
import { BaseSyncStrategy } from './base-sync.strategy';
import { EtagService } from '../services/etag.service';
import { Topic } from '@topics/entity/topic.entity';
import { EntitySync } from '../entity/entity-sync.entity';

@Injectable()
export class TopicSyncStrategy extends BaseSyncStrategy {
  entityKind = EntityKind.TOPIC;
  
  constructor(
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(EntitySync)
    entitySyncRepository: Repository<EntitySync>,
    etagService: EtagService,
  ) {
    super(etagService, entitySyncRepository);
  }
  
  async findAll(filters?: any): Promise<Topic[]> {
    const where: any = {};
    if (filters?.levelCode) {
      where.level_code = filters.levelCode;
    }
    
    return this.topicRepository.find({
      where,
      order: { order: 'ASC' },
      relations: ['level'],
    });
  }
  
  async findOne(entityKey: string): Promise<Topic> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entityKey);
    const topic = await this.topicRepository.findOne({
      where: isUuid ? { id: entityKey } : { slug: entityKey },
      relations: ['level'],
    });
    
    if (!topic) {
      throw new Error(`Topic with key ${entityKey} not found`);
    }
    
    return topic;
  }
  
  getEntityKey(entity: Topic): string {
    return entity.id;
  }
}

