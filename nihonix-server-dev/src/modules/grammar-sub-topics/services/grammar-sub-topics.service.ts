import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GrammarSubTopic } from '@grammar-sub-topics/entity/grammar-sub-topic.entity';

@Injectable()
export class GrammarSubTopicsService {
    constructor(
        @InjectRepository(GrammarSubTopic)
        private grammarSubTopicRepository: Repository<GrammarSubTopic>,
    ) { }

    async findAll(levelCode?: string, topicId?: string): Promise<GrammarSubTopic[]> {
        const where: any = {};
        if (levelCode) where.level_code = levelCode;
        if (topicId) where.topic_id = topicId;

        return this.grammarSubTopicRepository.find({
            where,
            order: { order: 'ASC' },
        });
    }

    async findBySlug(slug: string): Promise<GrammarSubTopic> {
        const grammarSubTopic = await this.grammarSubTopicRepository.findOne({
            where: { slug },
            relations: ['topic', 'level'],
        });

        if (!grammarSubTopic) {
            throw new NotFoundException(`Grammar sub-topic with slug ${slug} not found`);
        }

        return grammarSubTopic;
    }

    async findByLevel(levelCode: string): Promise<GrammarSubTopic[]> {
        return this.grammarSubTopicRepository.find({
            where: { level_code: levelCode },
            order: { order: 'ASC' },
            relations: ['topic', 'level'],
        });
    }
}

