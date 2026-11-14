import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createHash } from 'crypto';
import { Level } from './entity/level.entity';
import { Topic } from '../topics/entity/topic.entity';
import { VocabularySet } from '../vocabulary-sets/entity/vocabulary-set.entity';
import { VocabularyItem } from '../vocabulary-items/entity/vocabulary-item.entity';
import { GrammarSubTopic } from '../grammar-sub-topics/entity/grammar-sub-topic.entity';
import { GrammarPattern } from '../grammar-patterns/entity/grammar-pattern.entity';

@Injectable()
export class CatalogService {
  constructor(private readonly dataSource: DataSource) {}
  async levels(code?: string) {
    return this.dataSource.transaction('REPEATABLE READ', async manager => {
      const levels = await manager.getRepository(Level).find({ order: { code: 'DESC' } });
      const result: Array<Level & { topic_count: number; vocabulary_count: number; grammar_count: number }> = [];
      for (const level of levels.filter(l => !code || l.code === code.toUpperCase())) {
        const [topic_count, vocabulary_count, grammar_count] = await Promise.all([
          manager.getRepository(Topic).countBy({ level_code: level.code }),
          manager.getRepository(VocabularyItem).countBy({ level_code: level.code }),
          manager.getRepository(GrammarPattern).countBy({ level_code: level.code }),
        ]);
        result.push({ ...level, topic_count, vocabulary_count, grammar_count });
      }
      if (code && !result.length) throw new NotFoundException('Level not found');
      return code ? result[0] : result;
    });
  }
  async bundle(identifier: string) {
    return this.dataSource.transaction('REPEATABLE READ', async manager => {
      const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      const topic = await manager.getRepository(Topic).findOne({
        where: uuid ? { id: identifier } : { slug: identifier }, relations: ['level'],
      });
      if (!topic) throw new NotFoundException('Topic not found');
      const [vocabulary_sets, vocabulary_items, grammar_sub_topics, grammar_patterns] = await Promise.all([
        manager.getRepository(VocabularySet).find({ where: { topic_id: topic.id }, order: { order: 'ASC', slug: 'ASC' } }),
        manager.getRepository(VocabularyItem).find({ where: { topic_id: topic.id }, order: { order: 'ASC', slug: 'ASC' } }),
        manager.getRepository(GrammarSubTopic).find({ where: { topic_id: topic.id }, order: { order: 'ASC', slug: 'ASC' } }),
        manager.getRepository(GrammarPattern).find({ where: { topic_slug: topic.slug }, order: { order: 'ASC', slug: 'ASC' } }),
      ]);
      const content = { schema_version: 1, topic, vocabulary_sets, vocabulary_items, grammar_sub_topics, grammar_patterns };
      return { ...content, version: createHash('sha256').update(JSON.stringify(content)).digest('hex') };
    });
  }
}
