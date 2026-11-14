export interface ChangedEntity {
  entity_key: string;
  etag: string;
  data: any;
}

export interface DeletedEntity {
  entity_key: string;
}

export interface SyncResult {
  changed: ChangedEntity[];
  deleted: DeletedEntity[];
  unchanged: string[];
}

