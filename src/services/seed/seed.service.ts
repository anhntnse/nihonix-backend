import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Level } from '@levels/entity/level.entity';
import { Topic } from '@topics/entity/topic.entity';
import { GrammarSubTopic } from '@grammar-sub-topics/entity/grammar-sub-topic.entity';
import { VocabularyItem } from '@vocabulary-items/entity/vocabulary-item.entity';
import { GrammarPattern } from '@grammar-patterns/entity/grammar-pattern.entity';
import { VocabularySet } from '@vocabulary-sets/entity/vocabulary-set.entity';
import { EntitySyncService } from '@entity-sync/services/entity-sync.service';
import { EntityKind } from '@entity-sync/entity/entity-sync.entity';
import { topicsSeedData, grammarSubTopicsSeedData } from './seed-data';
import { detailedGrammarSubTopicsData } from './grammar-sub-topics-detailed.data';
import { topicIconsData } from './topic-icons.data';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Level)
    private levelRepository: Repository<Level>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(GrammarSubTopic)
    private grammarSubTopicRepository: Repository<GrammarSubTopic>,
    @InjectRepository(VocabularyItem)
    private vocabularyItemRepository: Repository<VocabularyItem>,
    @InjectRepository(GrammarPattern)
    private grammarPatternRepository: Repository<GrammarPattern>,
    @InjectRepository(VocabularySet)
    private vocabularySetRepository: Repository<VocabularySet>,
    private entitySyncService: EntitySyncService,
  ) {}

  async seedLevels(): Promise<void> {
    const { levelsSeedData } = await import('./seed-data');

    for (const levelData of levelsSeedData) {
      const existing = await this.levelRepository.findOne({
        where: { code: levelData.code },
      });

      if (!existing) {
        const level = await this.levelRepository.save(levelData);
        this.logger.log(`Seeded level: ${levelData.code}`);
        // Sync level để tạo ETag
        await this.entitySyncService.updateEntitySync(
          EntityKind.LEVEL,
          level.code,
          level,
        );
        this.logger.log(`Synced level ${level.code} to entity_sync table`);
      } else {
        // Sync existing level nếu chưa có ETag
        await this.entitySyncService.updateEntitySync(
          EntityKind.LEVEL,
          existing.code,
          existing,
        );
      }
    }
  }

  async seedTopics(): Promise<void> {
    const allTopics: Topic[] = [];

    for (const [levelCode, topics] of Object.entries(topicsSeedData)) {
      const iconData = topicIconsData[levelCode as keyof typeof topicIconsData] || [];
      
      for (const topicData of topics) {
        const existing = await this.topicRepository.findOne({
          where: { slug: topicData.slug },
        });

        // Find icon data for this topic
        const icon = iconData.find((i: any) => i.slug === topicData.slug);

        if (!existing) {
          const topic = await this.topicRepository.save({
            ...topicData,
            level_code: levelCode,
            icon_type: icon?.icon_type || 'material',
            icon_code: icon?.icon_code || null,
          });
          allTopics.push(topic);
          this.logger.log(`Seeded topic: ${topicData.slug} (${levelCode}) with icon ${icon?.icon_code || 'none'}`);
        } else {
          // Update existing topic with icon data if not set
          if (!existing.icon_code && icon) {
            existing.icon_type = icon.icon_type;
            existing.icon_code = icon.icon_code;
            await this.topicRepository.save(existing);
            this.logger.log(`Updated icon for topic: ${topicData.slug}`);
          }
          allTopics.push(existing);
        }
      }
    }

    // Sync tất cả topics để tạo ETag trong entity_sync table
    if (allTopics.length > 0) {
      for (const topic of allTopics) {
        await this.entitySyncService.updateEntitySync(
          EntityKind.TOPIC,
          topic.id,
          topic,
        );
      }
      this.logger.log(`Synced ${allTopics.length} topics to entity_sync table`);
    }
  }

  async seedGrammarSubTopics(): Promise<void> {
    // Seed grammar sub-topics cho từng topic (mỗi topic có 2-3 grammar sub-topics)
    const topicGrammarMapping = {
      N5: {
        'basic-patterns': ['greetings', 'daily-activities', 'school'],
        particles: ['time', 'places', 'directions'],
        verbs: ['daily-activities', 'food', 'hobbies'],
        adjectives: ['colors', 'weather', 'emotions'],
        questions: ['family', 'shopping', 'work'],
        negation: ['food', 'health', 'transportation'],
        'past-tense': ['daily-activities', 'travel', 'school'],
        desire: ['food', 'hobbies', 'shopping'],
      },
      N4: {
        causative: ['relationships', 'work', 'education'],
        passive: ['communication', 'media', 'entertainment'],
        potential: ['sports', 'technology', 'business'],
        conditional: ['shopping-advanced', 'banking', 'healthcare'],
        honorifics: ['business', 'education', 'relationships'],
        comparison: ['entertainment', 'sports', 'housing'],
        'giving-receiving': ['relationships', 'business', 'communication'],
        progressive: ['work', 'cooking', 'education'],
      },
      N3: {
        'causative-passive': ['business', 'economy', 'politics'],
        'complex-sentences': ['academic', 'literature', 'culture'],
        'formal-expressions': ['business', 'politics', 'academic'],
        'indirect-speech': ['literature', 'communication', 'culture'],
        conjunctions: ['economy', 'science', 'history'],
        'adverbial-clauses': ['philosophy', 'academic', 'literature'],
        modality: ['politics', 'philosophy', 'culture'],
        nominalization: ['academic', 'science', 'literature'],
      },
    };

    for (const [levelCode, grammarTopics] of Object.entries(
      topicGrammarMapping,
    )) {
      for (const [grammarSlug, topicSlugs] of Object.entries(grammarTopics)) {
        const grammarData = grammarSubTopicsSeedData[
          levelCode as keyof typeof grammarSubTopicsSeedData
        ]?.find((g) => g.slug === grammarSlug);

        if (grammarData) {
          for (const topicSlug of topicSlugs) {
            // Find topic by slug to get its id
            const topic = await this.topicRepository.findOne({
              where: { slug: topicSlug },
            });

            if (!topic) {
              this.logger.warn(`Topic with slug ${topicSlug} not found, skipping grammar sub-topic`);
              continue;
            }

            const existing = await this.grammarSubTopicRepository.findOne({
              where: {
                slug: `${grammarSlug}-${topicSlug}`,
              },
            });

            if (!existing) {
              await this.grammarSubTopicRepository.save({
                slug: `${grammarSlug}-${topicSlug}`,
                topic_id: topic.id,
                level_code: levelCode,
                title: grammarData.title,
                order: grammarData.order,
              });
              this.logger.log(
                `Seeded grammar sub-topic: ${grammarSlug}-${topicSlug} (${levelCode})`,
              );
            }
          }
        }
      }
    }
  }

  /**
   * Seed detailed grammar sub-topics based on Minna no Nihongo
   */
  async seedDetailedGrammarSubTopics(): Promise<void> {
    this.logger.log('Seeding detailed grammar sub-topics...');
    
    let totalNew = 0;
    let totalSkipped = 0;

    // Seed N5 data
    for (const [topicSlug, grammarSubTopics] of Object.entries(detailedGrammarSubTopicsData.N5)) {
      // Find topic by slug to get its ID
      const topic = await this.topicRepository.findOne({
        where: { slug: topicSlug },
      });

      if (!topic) {
        this.logger.warn(`Topic with slug ${topicSlug} not found, skipping grammar sub-topics`);
        continue;
      }

      // Seed each grammar sub-topic for this topic
      for (const grammarData of grammarSubTopics) {
        const slug = `${grammarData.slug || grammarData.grammar_type}-${topicSlug}`;
        
        const existing = await this.grammarSubTopicRepository.findOne({
          where: { slug },
        });

        if (!existing) {
          await this.grammarSubTopicRepository.save({
            slug,
            topic_id: topic.id,
            level_code: 'N5',
            title: grammarData.title,
            order: grammarData.order,
          });
          totalNew++;
          this.logger.log(`✓ Seeded: ${slug}`);
        } else {
          totalSkipped++;
        }
      }
    }

    this.logger.log(`Detailed grammar sub-topics seeded: ${totalNew} new, ${totalSkipped} skipped`);
  }

  async seedVocabularyItems(): Promise<void> {
    this.logger.log('Seeding vocabulary items...');
    const { vocabularyItemsSeedData } = await import('./vocabulary-items.data');

    let totalNew = 0;
    let totalSkipped = 0;

    for (const itemData of vocabularyItemsSeedData) {
      const topic = await this.topicRepository.findOne({
        where: { slug: itemData.topic_slug },
      });

      if (!topic) {
        this.logger.warn(`Topic ${itemData.topic_slug} not found for vocab ${itemData.slug}, skipping`);
        continue;
      }

      // Check or create a default VocabularySet for this topic if needed
      let vocabSet = await this.vocabularySetRepository.findOne({
        where: { topic_id: topic.id, slug: `set-${itemData.topic_slug}` },
      });

      if (!vocabSet) {
        vocabSet = await this.vocabularySetRepository.save({
          slug: `set-${itemData.topic_slug}`,
          topic_id: topic.id,
          title: topic.title,
          description: `Từ vựng chủ đề ${itemData.topic_slug}`,
          order: 1,
        });
      }

      const existing = await this.vocabularyItemRepository.findOne({
        where: { slug: itemData.slug },
      });

      if (!existing) {
        await this.vocabularyItemRepository.save({
          slug: itemData.slug,
          topic_id: topic.id,
          vocabulary_set_id: vocabSet.id,
          level_code: itemData.level_code,
          romaji: itemData.romaji,
          kanji: itemData.kanji,
          kana: itemData.kana,
          meaning: itemData.meaning,
          word_type: itemData.word_type,
          title: null,
          examples: itemData.examples,
          order: itemData.order,
        });
        totalNew++;
      } else {
        totalSkipped++;
      }
    }

    this.logger.log(`Vocabulary items seeded: ${totalNew} new, ${totalSkipped} skipped`);
  }

  async seedGrammarPatterns(): Promise<void> {
    this.logger.log('Seeding grammar patterns...');
    const { grammarPatternsSeedData } = await import('./grammar-patterns.data');

    let totalNew = 0;
    let totalSkipped = 0;

    for (const patternData of grammarPatternsSeedData) {
      const topic = await this.topicRepository.findOne({
        where: { slug: patternData.topic_slug },
      });

      if (!topic) {
        this.logger.warn(`Topic ${patternData.topic_slug} not found for pattern ${patternData.slug}, skipping`);
        continue;
      }

      const subTopic = await this.grammarSubTopicRepository.findOne({
        where: { slug: patternData.grammar_sub_topic_slug },
      });

      if (!subTopic) {
        this.logger.warn(`Sub-topic ${patternData.grammar_sub_topic_slug} not found for pattern ${patternData.slug}, skipping`);
        continue;
      }

      const existing = await this.grammarPatternRepository.findOne({
        where: { slug: patternData.slug },
      });

      if (!existing) {
        await this.grammarPatternRepository.save({
          slug: patternData.slug,
          grammar_sub_topic_slug: patternData.grammar_sub_topic_slug,
          topic_slug: patternData.topic_slug,
          level_code: patternData.level_code,
          pattern_jp: patternData.pattern_jp,
          pattern_romaji: patternData.pattern_romaji,
          explanation: patternData.explanation,
          usage_examples: patternData.usage_examples,
          conjugation_rules: patternData.conjugation_rules,
          level_difficulty: patternData.level_difficulty,
          grammar_points: patternData.grammar_points,
          order: patternData.order,
        });
        totalNew++;
      } else {
        totalSkipped++;
      }
    }

    this.logger.log(`Grammar patterns seeded: ${totalNew} new, ${totalSkipped} skipped`);
  }

  async seedAll(): Promise<void> {
    this.logger.log('Starting seed...');
    await this.seedLevels();
    await this.seedTopics();
    await this.seedGrammarSubTopics();
    await this.seedDetailedGrammarSubTopics();
    await this.seedVocabularyItems();
    await this.seedGrammarPatterns();
    this.logger.log('Seed completed!');
  }
}
