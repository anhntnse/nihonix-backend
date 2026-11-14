import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityKind, EntitySync } from '../entity/entity-sync.entity';
import { ISyncStrategy } from '../interfaces/sync-strategy.interface';
import { SyncResult } from '../interfaces/sync-result.interface';
import { EtagService } from './etag.service';

@Injectable()
export class EntitySyncService {
  private strategies: Map<EntityKind, ISyncStrategy>;
  
  constructor(
    strategies: ISyncStrategy[],
    @InjectRepository(EntitySync)
    private entitySyncRepository: Repository<EntitySync>,
    private etagService: EtagService,
  ) {
    // Initialize strategy map
    this.strategies = new Map();
    strategies.forEach(strategy => {
      this.strategies.set(strategy.entityKind, strategy);
    });
  }
  
  /**
   * Get strategy for entity kind
   */
  private getStrategy(entityKind: EntityKind): ISyncStrategy {
    const strategy = this.strategies.get(entityKind);
    if (!strategy) {
      throw new NotFoundException(`No sync strategy found for entity kind: ${entityKind}`);
    }
    return strategy;
  }
  
  /**
   * Check sync status for entities
   */
  async checkSync(
    entityKind: EntityKind,
    filters?: any,
    etags?: Map<string, string>,
  ): Promise<SyncResult> {
    const strategy = this.getStrategy(entityKind);
    return strategy.checkSync(filters, etags);
  }
  
  /**
   * Update entity_sync when entity changes
   */
  async updateEntitySync(entityKind: EntityKind, entityKey: string, entity: any): Promise<void> {
    const strategy = this.getStrategy(entityKind);
    await strategy.updateEntitySync(entityKey, entity);
  }
  
  /**
   * Get entity by key
   */
  async findOne(entityKind: EntityKind, entityKey: string): Promise<any> {
    const strategy = this.getStrategy(entityKind);
    return strategy.findOne(entityKey);
  }
  
  /**
   * Check single entity sync with If-None-Match header
   * Returns entity if ETag doesn't match, or null if matches (304 Not Modified)
   */
  async checkSingle(
    entityKind: EntityKind,
    entityKey: string,
    clientETag?: string,
  ): Promise<{ entity: any; etag: string } | null> {
    const strategy = this.getStrategy(entityKind);
    const entity = await strategy.findOne(entityKey);
    
    // Get current ETag from entity_sync table
    const syncRecord = await this.entitySyncRepository.findOne({
      where: {
        entity_kind: entityKind,
        entity_key: entityKey,
      },
    });
    
    // Generate or get current ETag
    const currentETag = syncRecord?.row_etag || 
      this.etagService.generateETag(entity, syncRecord?.updated_at || new Date());
    
    // If client ETag matches, return null (304 Not Modified)
    if (clientETag && clientETag === currentETag) {
      return null;
    }
    
    // ETag doesn't match or no client ETag - return entity with new ETag
    return {
      entity,
      etag: currentETag,
    };
  }
}

