import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Topic } from '@topics/entity/topic.entity';
import { Level } from '@levels/entity/level.entity';
import { EntitySyncService } from '@entity-sync/services/entity-sync.service';
import { EntityKind, EntitySync } from '@entity-sync/entity/entity-sync.entity';
import { EtagService } from '@entity-sync/services/etag.service';
import { CreateTopicDto } from '../dto/create-topic.dto';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(Level)
    private levelRepository: Repository<Level>,
    @InjectRepository(EntitySync)
    private entitySyncRepository: Repository<EntitySync>,
    private entitySyncService: EntitySyncService,
    private etagService: EtagService,
  ) {}

  async findAll(levelCode?: string): Promise<(Topic & { etag?: string })[]> {
    const where: any = {};
    if (levelCode) where.level_code = levelCode;

    const topics = await this.topicRepository.find({
      where,
      order: { order: 'ASC', id: 'ASC' },
      relations: ['level'],
    });

    // Get ETags for all topics (use id as entity_key now)
    const ids = topics.map(t => t.id);
    const syncRecords = await this.entitySyncRepository.find({
      where: {
        entity_kind: EntityKind.TOPIC,
        entity_key: In(ids),
      },
    });

    // Create map of id -> ETag
    const etagMap = new Map<string, string>();
    syncRecords.forEach(record => {
      etagMap.set(record.entity_key, record.row_etag);
    });

    // Attach ETag to each topic
    return topics.map(topic => {
      const etag = etagMap.get(topic.id) || 
        this.etagService.generateETag(topic, new Date(0));
      return { ...topic, etag } as Topic & { etag: string };
    });
  }

  async findOne(identifier: string): Promise<Topic> {
    // Try to find by id first (UUID pattern check)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    const topic = await this.topicRepository.findOne({
      where: isUuid ? { id: identifier } : { slug: identifier },
      relations: ['level'],
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ${isUuid ? 'id' : 'slug'} ${identifier} not found`);
    }

    return topic;
  }

  async findBySlug(slug: string): Promise<Topic> {
    const topic = await this.topicRepository.findOne({
      where: { slug },
      relations: ['level'],
    });

    if (!topic) {
      throw new NotFoundException(`Topic with slug ${slug} not found`);
    }

    return topic;
  }

  async findById(id: string): Promise<Topic> {
    const topic = await this.topicRepository.findOne({
      where: { id },
      relations: ['level'],
    });

    if (!topic) {
      throw new NotFoundException(`Topic with id ${id} not found`);
    }

    return topic;
  }

  async create(createTopicDto: CreateTopicDto): Promise<Topic & { etag: string }> {
    // Check if topic with slug already exists
    const existingTopic = await this.topicRepository.findOne({
      where: { slug: createTopicDto.slug },
    });

    if (existingTopic) {
      throw new ConflictException(`Topic with slug ${createTopicDto.slug} already exists`);
    }

    // Check if level exists
    const level = await this.levelRepository.findOne({
      where: { code: createTopicDto.level_code as 'N5' | 'N4' | 'N3' | 'N2' | 'N1' },
    });

    if (!level) {
      throw new BadRequestException(`Level with code ${createTopicDto.level_code} not found`);
    }

    // Create topic
    const topic = this.topicRepository.create({
      slug: createTopicDto.slug,
      level_code: createTopicDto.level_code,
      title: createTopicDto.title,
      icon_svg: createTopicDto.icon_svg || null,
      icon_type: createTopicDto.icon_type || 'material',
      icon_code: createTopicDto.icon_code || null,
      order: createTopicDto.order || 1,
    });

    const savedTopic = await this.topicRepository.save(topic);

    // Sync to entity_sync table
    await this.syncTopic(savedTopic);

    // Get ETag for response
    const syncRecord = await this.entitySyncRepository.findOne({
      where: {
        entity_kind: EntityKind.TOPIC,
        entity_key: savedTopic.id,
      },
    });

    const etag = syncRecord?.row_etag || this.etagService.generateETag(savedTopic, new Date(0));

    return { ...savedTopic, etag } as Topic & { etag: string };
  }


  /**
   * Update entity_sync when topic changes
   * Call this after creating/updating a topic
   */
  async syncTopic(topic: Topic): Promise<void> {
    await this.entitySyncService.updateEntitySync(
      EntityKind.TOPIC,
      topic.id,
      topic,
    );
  }

  /**
   * Batch sync multiple topics
   * Useful after seeding
   */
  async syncTopics(topics: Topic[]): Promise<void> {
    for (const topic of topics) {
      await this.syncTopic(topic);
    }
  }
}

