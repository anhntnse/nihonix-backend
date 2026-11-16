import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { VocabularyItemsService } from './services/vocabulary-items.service';
import { GenerateVocabularyDto } from '@vocabulary-items/dto';
import { VocabularyItem } from './entity/vocabulary-item.entity';

@ApiTags('Vocabulary Items')
@Controller('vocabulary-items')
@UseGuards(JwtAuthGuard)
export class VocabularyItemsController {
  constructor(private readonly vocabularyItemsService: VocabularyItemsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all vocabulary items' })
  @ApiOkResponse({ description: 'List of vocabulary items' })
  @ApiQuery({ name: 'topic_id', required: false, description: 'Filter by topic ID (UUID)' })
  async findAll(@Query('topic_id') topicId?: string): Promise<VocabularyItem[]> {
    return this.vocabularyItemsService.findAll(topicId);
  }

  @Get('sets/all')
  @ApiOperation({ summary: 'Get all vocabulary sets grouped by topic' })
  @ApiOkResponse({ description: 'List of vocabulary sets (one per topic with vocabulary items)' })
  async getAllSets(): Promise<any[]> {
    return this.vocabularyItemsService.getAllSets();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get vocabulary item by slug' })
  @ApiOkResponse({ description: 'Vocabulary item details' })
  @ApiParam({ name: 'slug', description: 'Vocabulary item slug (primary key)' })
  async findOne(@Param('slug') slug: string): Promise<VocabularyItem> {
    return this.vocabularyItemsService.findOne(slug);
  }

  @Post('generate')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Generate vocabulary items using AI' })
  @ApiOkResponse({ description: 'Vocabulary generation started/completed' })
  @ApiBody({ type: GenerateVocabularyDto })
  async generate(@Body() dto: GenerateVocabularyDto): Promise<any> {
    return this.vocabularyItemsService.generateVocabulary(dto);
  }
}

