import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VocabularySet } from './entity/vocabulary-set.entity';
import { Topic } from '@topics/entity/topic.entity';
import { CreateVocabularySetDto } from './dto';

@Injectable()
export class VocabularySetsService {
  constructor(
    @InjectRepository(VocabularySet)
    private vocabularySetRepository: Repository<VocabularySet>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
  ) {}

  async findAll(): Promise<VocabularySet[]> {
    return this.vocabularySetRepository.find({
      order: { order: 'ASC' },
      relations: ['topic', 'items'],
    });
  }

  async findByTopicId(topicId: string): Promise<any[]> {
    const sets = await this.vocabularySetRepository
      .createQueryBuilder('set')
      .leftJoin('set.items', 'items')
      .where('set.topic_id = :topicId', { topicId })
      .select([
        'set.id',
        'set.slug',
        'set.title',
        'set.description',
        'set.order',
        'set.created_at',
        'set.updated_at',
      ])
      .addSelect('COUNT(items.slug)', 'items_count')
      .groupBy('set.id')
      .orderBy('set.order', 'ASC')
      .getRawAndEntities();

    return sets.entities.map((set, index) => ({
      id: set.id,
      slug: set.slug,
      title: set.title,
      description: set.description,
      order: set.order,
      items_count: parseInt(sets.raw[index].items_count) || 0,
      created_at: set.created_at,
      updated_at: set.updated_at,
    }));
  }

  async findOne(id: string): Promise<VocabularySet> {
    const set = await this.vocabularySetRepository.findOne({
      where: { id },
      relations: ['topic', 'items'],
    });

    if (!set) {
      throw new NotFoundException(`Vocabulary set with id ${id} not found`);
    }

    return set;
  }

  async create(dto: CreateVocabularySetDto): Promise<VocabularySet> {
    // Verify topic exists
    const topic = await this.topicRepository.findOne({
      where: { id: dto.topic_id },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with id ${dto.topic_id} not found`);
    }

    // Generate slug from title
    const slug = this.generateSlug(dto.title.en, topic.slug);

    const set = this.vocabularySetRepository.create({
      topic_id: dto.topic_id,
      slug,
      title: dto.title,
      description: dto.description || null,
      order: dto.order || 1,
    });

    return this.vocabularySetRepository.save(set);
  }

  private generateSlug(title: string, topicSlug: string): string {
    const cleanTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    return `${cleanTitle}-${topicSlug}-${Date.now()}`;
  }
}

