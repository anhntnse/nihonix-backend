import { EntityKind } from '../entity/entity-sync.entity';
import { SyncResult } from './sync-result.interface';

export interface ISyncStrategy {
  entityKind: EntityKind;
  
  /**
   * Check sync status for entities
   * @param filters Filter criteria (e.g., levelCode for topics)
   * @param etags Map of entity_key -> etag from client
   * @returns Sync result with changed, deleted, unchanged entities
   */
  checkSync(filters?: any, etags?: Map<string, string>): Promise<SyncResult>;
  
  /**
   * Update entity_sync table when entity changes
   * @param entityKey Entity identifier (slug for topic, code for level)
   * @param entity Entity data
   */
  updateEntitySync(entityKey: string, entity: any): Promise<void>;
  
  /**
   * Get entity by key
   * @param entityKey Entity identifier
   * @returns Entity data
   */
  findOne(entityKey: string): Promise<any>;
  
  /**
   * Get all entities with optional filters
   * @param filters Filter criteria
   * @returns Array of entities
   */
  findAll(filters?: any): Promise<any[]>;
  
  /**
   * Extract entity key from entity object
   * @param entity Entity object
   * @returns Entity key (slug/code)
   */
  getEntityKey(entity: any): string;
}

