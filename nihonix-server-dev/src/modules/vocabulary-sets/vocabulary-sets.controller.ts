import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiQuery, ApiCreatedResponse, ApiBody } from '@nestjs/swagger';
import { VocabularySetsService } from './vocabulary-sets.service';
import { VocabularySet } from './entity/vocabulary-set.entity';
import { CreateVocabularySetDto } from './dto';

@ApiTags('Vocabulary Sets')
@Controller('vocabulary-sets')
export class VocabularySetsController {
  constructor(private readonly vocabularySetsService: VocabularySetsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all vocabulary sets' })
  @ApiOkResponse({ description: 'List of vocabulary sets' })
  async findAll(): Promise<VocabularySet[]> {
    return this.vocabularySetsService.findAll();
  }

  @Get('by-topic/:topicId')
  @ApiOperation({ summary: 'Get vocabulary sets by topic ID (list only, no items)' })
  @ApiOkResponse({ 
    description: 'List of vocabulary sets with item counts',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          slug: { type: 'string' },
          title: { type: 'object', properties: { vi: { type: 'string' }, en: { type: 'string' }, jp: { type: 'string' } } },
          description: { type: 'string', nullable: true },
          items_count: { type: 'number' },
          created_at: { type: 'string', format: 'date-time' },
        }
      }
    }
  })
  @ApiParam({ name: 'topicId', description: 'Topic ID (UUID)' })
  async findByTopicId(@Param('topicId') topicId: string): Promise<any[]> {
    return this.vocabularySetsService.findByTopicId(topicId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vocabulary set by ID' })
  @ApiOkResponse({ description: 'Vocabulary set details with items' })
  @ApiParam({ name: 'id', description: 'Vocabulary set ID (UUID)' })
  async findOne(@Param('id') id: string): Promise<VocabularySet> {
    return this.vocabularySetsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new vocabulary set' })
  @ApiBody({ type: CreateVocabularySetDto })
  @ApiCreatedResponse({ description: 'Vocabulary set created successfully' })
  async create(@Body() dto: CreateVocabularySetDto): Promise<VocabularySet> {
    return this.vocabularySetsService.create(dto);
  }
}

