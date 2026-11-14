import { Controller, Get, Param, Query, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiQuery, ApiCreatedResponse, ApiBody } from '@nestjs/swagger';
import { TopicsService } from './services/topics.service';
import { SeedService } from '@services/seed/seed.service';
import { Topic } from './entity/topic.entity';
import { CreateTopicDto } from './dto/create-topic.dto';
import { GetTopicsDto } from './dto/get-topics.dto';

@ApiTags('Topics (Lessons)')
@Controller('topics')
export class TopicsController {
  constructor(
    private readonly topicsService: TopicsService,
    private readonly seedService: SeedService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all topics (lessons) with ETags' })
  @ApiOkResponse({ description: 'List of topics with ETag for each topic' })
  async findAll(@Query() query: GetTopicsDto): Promise<(Topic & { etag?: string })[]> {
    return this.topicsService.findAll(query.levelCode);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new topic (lesson)' })
  @ApiBody({ type: CreateTopicDto })
  @ApiCreatedResponse({ description: 'Topic created successfully with ETag' })
  async create(@Body() createTopicDto: CreateTopicDto): Promise<Topic & { etag: string }> {
    return this.topicsService.create(createTopicDto);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed data for topics and grammar sub-topics (N3-N5)' })
  @ApiOkResponse({ description: 'Seed completed' })
  async seed(): Promise<{ message: string }> {
    await this.seedService.seedAll();
    return { message: 'Seed completed successfully' };
  }

  @Get(':identifier')
  @ApiOperation({ summary: 'Get topic (lesson) by id or slug' })
  @ApiOkResponse({ description: 'Topic details' })
  @ApiParam({ name: 'identifier', description: 'Topic ID (UUID) or slug' })
  async findOne(@Param('identifier') identifier: string): Promise<Topic> {
    return this.topicsService.findOne(identifier);
  }
}

