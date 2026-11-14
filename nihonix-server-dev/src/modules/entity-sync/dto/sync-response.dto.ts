import { ApiProperty } from '@nestjs/swagger';

export class ChangedEntityDto {
  @ApiProperty({ description: 'Entity key (slug/code)' })
  entity_key!: string;

  @ApiProperty({ description: 'New ETag' })
  etag!: string;

  @ApiProperty({ description: 'Entity data' })
  data!: any;
}

export class DeletedEntityDto {
  @ApiProperty({ description: 'Entity key that was deleted' })
  entity_key!: string;
}

export class SyncResponseDto {
  @ApiProperty({ type: [ChangedEntityDto], description: 'Entities that changed' })
  changed!: ChangedEntityDto[];

  @ApiProperty({ type: [DeletedEntityDto], description: 'Entities that were deleted' })
  deleted!: DeletedEntityDto[];

  @ApiProperty({ type: [String], description: 'Entity keys that are unchanged' })
  unchanged!: string[];
}

