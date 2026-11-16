import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { GrammarPatternsService } from './services/grammar-patterns.service';
import { GenerateGrammarDto } from '@grammar-patterns/dto';
import { GrammarPattern } from './entity/grammar-pattern.entity';

@ApiTags('Grammar Patterns')
@Controller('grammar-patterns')
@UseGuards(JwtAuthGuard)
export class GrammarPatternsController {
  constructor(private readonly grammarPatternsService: GrammarPatternsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all grammar patterns' })
  @ApiOkResponse({ description: 'List of grammar patterns' })
  @ApiQuery({ name: 'grammar_sub_topic_slug', required: false, description: 'Filter by grammar sub-topic slug' })
  async findAll(@Query('grammar_sub_topic_slug') grammarSubTopicSlug?: string): Promise<GrammarPattern[]> {
    return this.grammarPatternsService.findAll(grammarSubTopicSlug);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get grammar pattern by slug' })
  @ApiOkResponse({ description: 'Grammar pattern details' })
  @ApiParam({ name: 'slug', description: 'Grammar pattern slug' })
  async findBySlug(@Param('slug') slug: string): Promise<GrammarPattern> {
    return this.grammarPatternsService.findBySlug(slug);
  }

  @Get('sub-topic/:grammarSubTopicSlug')
  @ApiOperation({ summary: 'Get grammar patterns by grammar sub-topic' })
  @ApiOkResponse({ description: 'List of grammar patterns for a grammar sub-topic' })
  @ApiParam({ name: 'grammarSubTopicSlug', description: 'Grammar sub-topic slug' })
  async findByGrammarSubTopic(@Param('grammarSubTopicSlug') grammarSubTopicSlug: string): Promise<GrammarPattern[]> {
    return this.grammarPatternsService.findByGrammarSubTopic(grammarSubTopicSlug);
  }

  @Post('generate')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Generate grammar patterns using AI' })
  @ApiOkResponse({ description: 'Grammar generation started/completed' })
  @ApiBody({ type: GenerateGrammarDto })
  async generate(@Body() dto: GenerateGrammarDto): Promise<any> {
    return this.grammarPatternsService.generateGrammar(dto);
  }
}

