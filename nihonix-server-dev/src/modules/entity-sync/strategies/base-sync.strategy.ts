import { ISyncStrategy } from '../interfaces/sync-strategy.interface';
import { EntityKind } from '../entity/entity-sync.entity';
import { SyncResult, ChangedEntity, DeletedEntity } from '../interfaces/sync-result.interface';
import { EtagService } from '../services/etag.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntitySync } from '../entity/entity-sync.entity';

export abstract class BaseSyncStrategy implements ISyncStrategy {
  abstract entityKind: EntityKind;
  
  constructor(
    protected etagService: EtagService,
    protected entitySyncRepository: Repository<EntitySync>,
  ) {}
  
  abstract findAll(filters?: any): Promise<any[]>;
  abstract findOne(entityKey: string): Promise<any>;
  abstract getEntityKey(entity: any): string;
  
  /**
   * Check sync status - compare ETags from client with server
   */
  async checkSync(filters?: any, etags?: Map<string, string>): Promise<SyncResult> {
    // Get all entities from DB
    const entities = await this.findAll(filters);
    
    // Get entity_sync records
    const entityKeys = entities.map(e => this.getEntityKey(e));
    const syncRecords = await this.entitySyncRepository.find({
      where: entityKeys.map(key => ({
        entity_kind: this.entityKind,
        entity_key: key,
      })),
    });
    
    // Create map of entity_key -> sync record
    const syncMap = new Map<string, EntitySync>();
    syncRecords.forEach(record => {
      syncMap.set(record.entity_key, record);
    });
    
    const changed: ChangedEntity[] = [];
    const deleted: DeletedEntity[] = [];
    const unchanged: string[] = [];
    const clientETags = etags || new Map();
    
    // Process each entity
    for (const entity of entities) {
      const entityKey = this.getEntityKey(entity);
      const syncRecord = syncMap.get(entityKey);
      
      // Skip if entity is marked as deleted
      if (syncRecord?.is_deleted) {
        deleted.push({ entity_key: entityKey });
        continue;
      }
      
      // Generate current ETag
      const currentETag = syncRecord?.row_etag || this.etagService.generateETag(entity, syncRecord?.updated_at);
      
      // Get client ETag
      const clientETag = clientETags.get(entityKey);
      
      if (!clientETag) {
        // New entity - client doesn't have it
        changed.push({
          entity_key: entityKey,
          etag: currentETag,
          data: entity,
        });
      } else if (clientETag !== currentETag) {
        // ETag changed - entity updated
        changed.push({
          entity_key: entityKey,
          etag: currentETag,
          data: entity,
        });
      } else {
        // ETag matches - unchanged
        unchanged.push(entityKey);
      }
    }
    
    // Check for entities deleted on server (exist in client but not in server)
    if (clientETags.size > 0) {
      const serverKeys = new Set(entityKeys);
      clientETags.forEach((_, entityKey) => {
        if (!serverKeys.has(entityKey)) {
          // Check if it's marked as deleted
          const syncRecord = syncRecords.find(r => r.entity_key === entityKey && r.is_deleted);
          if (syncRecord) {
            deleted.push({ entity_key: entityKey });
          }
        }
      });
    }
    
    return { changed, deleted, unchanged };
  }
  
  /**
   * Update entity_sync table when entity changes
   */
  async updateEntitySync(entityKey: string, entity: any): Promise<void> {
    const etag = this.etagService.generateETag(entity);
    
    await this.entitySyncRepository.save({
      entity_kind: this.entityKind,
      entity_key: entityKey,
      row_etag: etag,
      updated_at: new Date(),
      is_deleted: false,
      moved_to_key: null,
    });
  }
}

