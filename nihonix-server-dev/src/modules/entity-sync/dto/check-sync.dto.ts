import { IsEnum, IsOptional, IsArray, ValidateNested, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { EntityKind } from '../entity/entity-sync.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EntityETagDto {
  @ApiProperty({ description: 'Entity key (slug for topic, code for level)' })
  @IsString()
  @IsNotEmpty()
  entity_key!: string;

  @ApiProperty({ description: 'Current ETag from client' })
  @IsString()
  @IsNotEmpty()
  etag!: string;
}

export class CheckSyncDto {
  @ApiProperty({ enum: EntityKind, description: 'Entity kind to sync' })
  @IsEnum(EntityKind)
  entityKind!: EntityKind;

  @ApiPropertyOptional({ description: 'Filter by level code (for topics)' })
  @IsString()
  @IsOptional()
  levelCode?: string;

  @ApiProperty({ 
    type: [EntityETagDto], 
    description: 'List of entity keys with their ETags from client',
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EntityETagDto)
  @IsOptional()
  etags?: EntityETagDto[];
}

