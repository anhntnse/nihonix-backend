import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { GrammarSubTopicsService } from './services/grammar-sub-topics.service';
import { GrammarSubTopic } from './entity/grammar-sub-topic.entity';

@ApiTags('Grammar Sub-Topics')
@Controller('grammar-sub-topics')
@UseGuards(JwtAuthGuard)
export class GrammarSubTopicsController {
  constructor(private readonly grammarSubTopicsService: GrammarSubTopicsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all grammar sub-topics' })
  @ApiOkResponse({ description: 'List of grammar sub-topics' })
  @ApiQuery({ name: 'levelCode', required: false, description: 'Filter by level code (N5, N4, N3)' })
  @ApiQuery({ name: 'topicId', required: false, description: 'Filter by topic ID (UUID)' })
  async findAll(
    @Query('levelCode') levelCode?: string,
    @Query('topicId') topicId?: string,
  ): Promise<GrammarSubTopic[]> {
    return this.grammarSubTopicsService.findAll(levelCode, topicId);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get grammar sub-topic by slug' })
  @ApiOkResponse({ description: 'Grammar sub-topic details' })
  @ApiParam({ name: 'slug', description: 'Grammar sub-topic slug' })
  async findBySlug(@Param('slug') slug: string): Promise<GrammarSubTopic> {
    return this.grammarSubTopicsService.findBySlug(slug);
  }

  @Get('level/:levelCode')
  @ApiOperation({ summary: 'Get grammar sub-topics by level' })
  @ApiOkResponse({ description: 'List of grammar sub-topics for a level' })
  @ApiParam({ name: 'levelCode', description: 'Level code (N5, N4, N3)' })
  async findByLevel(@Param('levelCode') levelCode: string): Promise<GrammarSubTopic[]> {
    return this.grammarSubTopicsService.findByLevel(levelCode);
  }
}

