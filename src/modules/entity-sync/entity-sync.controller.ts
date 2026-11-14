import { Controller, Post, Body, Get, Param, Query, HttpCode, HttpStatus, Headers, Res, NotFoundException, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { EntitySyncService } from './services/entity-sync.service';
import { CheckSyncDto } from './dto/check-sync.dto';
import { SyncResponseDto } from './dto/sync-response.dto';
import { EntityKind } from './entity/entity-sync.entity';

@ApiTags('Entity Sync')
@Controller('entity-sync')
export class EntitySyncController {
  constructor(private readonly entitySyncService: EntitySyncService) {}
  
  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check sync status for entities' })
  @ApiOkResponse({ type: SyncResponseDto, description: 'Sync result with changed, deleted, unchanged entities' })
  async checkSync(@Body() checkSyncDto: CheckSyncDto): Promise<SyncResponseDto> {
    // Convert etags array to Map
    const etagsMap = new Map<string, string>();
    if (checkSyncDto.etags) {
      checkSyncDto.etags.forEach(item => {
        etagsMap.set(item.entity_key, item.etag);
      });
    }
    
    const filters: any = {};
    if (checkSyncDto.levelCode) {
      filters.levelCode = checkSyncDto.levelCode;
    }
    
    const result = await this.entitySyncService.checkSync(
      checkSyncDto.entityKind,
      filters,
      etagsMap,
    );
    
    return {
      changed: result.changed.map(item => ({
        entity_key: item.entity_key,
        etag: item.etag,
        data: item.data,
      })),
      deleted: result.deleted.map(item => ({
        entity_key: item.entity_key,
      })),
      unchanged: result.unchanged,
    };
  }
  
  @Get(':entityKind/:entityKey')
  @ApiOperation({ 
    summary: 'Get single entity with ETag',
    description: 'Returns entity data. Optionally send "If-None-Match" header with ETag to check if changed. If ETag matches, returns 304 Not Modified.',
  })
  @ApiParam({ name: 'entityKind', enum: EntityKind, description: 'Entity kind: topic or level', required: true })
  @ApiParam({ name: 'entityKey', description: 'Entity key - slug for topic (e.g. greetings), code for level (e.g. N5)', required: true })
  @ApiHeader({ 
    name: 'If-None-Match', 
    required: false,
    description: 'Optional: ETag from previous request. If matches current ETag, returns 304 Not Modified.',
    allowEmptyValue: true,
  })
  @ApiOkResponse({ description: 'Entity data with ETag header. Returns 304 Not Modified if If-None-Match header matches current ETag.' })
  async getEntity(
    @Param('entityKind') entityKind: EntityKind,
    @Param('entityKey') entityKey: string,
    @Req() req: Request,
    @Res() res?: Response,
  ) {
    // Get If-None-Match header manually to avoid Swagger auto-detection
    const ifNoneMatch = req.headers['if-none-match'] as string | undefined;
    try {
      const result = await this.entitySyncService.checkSingle(
        entityKind,
        entityKey,
        ifNoneMatch,
      );
      
      // If ETag matches (304 Not Modified)
      if (!result) {
        return res?.status(HttpStatus.NOT_MODIFIED).send() || {
          statusCode: HttpStatus.NOT_MODIFIED,
          message: 'Not Modified',
        };
      }
      
      // ETag doesn't match - return entity with new ETag
      res?.setHeader('ETag', result.etag);
      return result.entity;
    } catch (error) {
      throw new NotFoundException(`Entity ${entityKey} not found`);
    }
  }
}

