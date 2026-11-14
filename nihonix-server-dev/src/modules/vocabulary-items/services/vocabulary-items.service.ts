import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VocabularyItem } from '@vocabulary-items/entity/vocabulary-item.entity';
import { VocabularySet } from '@vocabulary-sets/entity/vocabulary-set.entity';
import { Topic } from '@topics/entity/topic.entity';
import { GenerateVocabularyDto } from '@vocabulary-items/dto';
import { AiGenerationService } from '@ai/services/ai-generation.service';
import { AiJsonParserService } from '@ai/services/ai-json-parser.service';
import { RetryNeededException } from '@ai/exceptions/retry-needed.exception';

@Injectable()
export class VocabularyItemsService {
  private readonly logger = new Logger(VocabularyItemsService.name);

  constructor(
    @InjectRepository(VocabularyItem)
    private vocabularyItemRepository: Repository<VocabularyItem>,
    @InjectRepository(VocabularySet)
    private vocabularySetRepository: Repository<VocabularySet>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    private aiGenerationService: AiGenerationService,
    private aiJsonParserService: AiJsonParserService,
  ) {}

  async findAll(topicId?: string): Promise<VocabularyItem[]> {
    const where: any = {};
    if (topicId) where.topic_id = topicId;

    return this.vocabularyItemRepository.find({
      where,
      order: { order: 'ASC' },
      relations: ['topic', 'level'],
    });
  }

  async findOne(identifier: string): Promise<VocabularyItem> {
    // VocabularyItem uses slug as primary key, so we only support slug lookup
    const item = await this.vocabularyItemRepository.findOne({
      where: { slug: identifier },
      relations: ['topic', 'level'],
    });

    if (!item) {
      throw new NotFoundException(`Vocabulary item with slug ${identifier} not found`);
    }

    return item;
  }

  async findBySlug(slug: string): Promise<VocabularyItem> {
    return this.findOne(slug);
  }

  /**
   * Get all vocabulary sets grouped by topic
   * Returns one set per topic (similar to flashcard folders)
   */
  async getAllSets(): Promise<any[]> {
    // Get all vocabulary items with topic relation
    const items = await this.vocabularyItemRepository.find({
      order: { topic_id: 'ASC', order: 'ASC' },
      relations: ['topic', 'level'],
    });

    // Group by topic
    const setsMap = new Map<string, any>();

    for (const item of items) {
      const topicId = item.topic_id;

      if (!setsMap.has(topicId)) {
        setsMap.set(topicId, {
          topic_id: item.topic.id,
          topic_slug: item.topic.slug,
          topic_title: item.topic.title,
          topic_icon_type: item.topic.icon_type,
          topic_icon_code: item.topic.icon_code,
          level_code: item.level_code,
          level: {
            code: item.level.code,
            name: item.level.name,
          },
          items_count: 0,
          items: [],
        });
      }

      const set = setsMap.get(topicId);
      set.items_count++;
      set.items.push({
        slug: item.slug,
        romaji: item.romaji,
        kanji: item.kanji,
        kana: item.kana,
        meaning: item.meaning,
        word_type: item.word_type,
        title: item.title,
        examples: item.examples,
        order: item.order,
      });
    }

    return Array.from(setsMap.values());
  }

  /**
   * Generate vocabulary SET with items using AI
   * AI generates: set_title + vocabulary_items
   */
  async generateVocabulary(dto: GenerateVocabularyDto): Promise<any> {
    try {
      this.logger.log(`Generating vocabulary set for topic: ${dto.topic_id}`);

      const count = dto.count || 10;
      const levelCode = dto.level_code || 'N5';

      // Validate topic exists
      const topic = await this.topicRepository.findOne({
        where: { id: dto.topic_id },
      });

      if (!topic) {
        throw new NotFoundException(`Topic with id ${dto.topic_id} not found`);
      }

      const basePrompt = dto.custom_prompt || this.buildPrompt(topic.slug, count, levelCode);

      const maxRetries = 3;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const prompt = attempt === 0 ? basePrompt : this.buildRetryPrompt(basePrompt, count);

          this.logger.debug(`Using prompt for attempt ${attempt + 1}/${maxRetries + 1}`);

          const response = await this.aiGenerationService.generateWithRetry({
            prompt,
            expectedCount: 1, // Expecting 1 object with set_title + items
            tokensPerItem: 600 * count,
            maxRetries: 0,
          });

          const result = this.aiJsonParserService.parseJson<any>(response.content, {
            expectedCount: 1,
            allowRepair: true,
            arrayType: 'object',
          });

          // Validate structure: { set_title: {...}, items: [...] }
          if (!result.set_title || !result.items || !Array.isArray(result.items)) {
            throw new RetryNeededException('AI response missing set_title or items array');
          }

          // Validate set_title
          if (!result.set_title.vi || !result.set_title.en || !result.set_title.jp) {
            throw new RetryNeededException('set_title missing required languages');
          }

          // Validate items
          const validatedItems = this.validateVocabularyItems(result.items);
          if (validatedItems.length === 0) {
            throw new RetryNeededException('All vocabulary items are missing required fields');
          }

          // 1. Create VocabularySet first
          const vocabularySet = await this.createVocabularySet(
            dto.topic_id,
            topic.slug,
            result.set_title,
            null, // No description needed
          );

          // 2. Save vocabulary items with vocabulary_set_id
          const savedItems = await this.saveVocabularyItemsWithSet(
            validatedItems,
            dto.topic_id,
            vocabularySet.id,
            levelCode,
            topic.slug,
          );

          if (savedItems.length === 0) {
            // Rollback: delete the empty set
            await this.vocabularySetRepository.delete(vocabularySet.id);
            this.logger.warn(`No new vocabulary items were saved, set deleted`);
            throw new RetryNeededException(`No new vocabulary items could be saved`);
          }

          return {
            set_id: vocabularySet.id,
            set_slug: vocabularySet.slug,
            set_title: vocabularySet.title,
            topic_id: dto.topic_id,
            level_code: levelCode,
            requested_count: count,
            generated_count: savedItems.length,
            items: savedItems.map(item => ({
              slug: item.slug,
              romaji: item.romaji,
              kanji: item.kanji,
              kana: item.kana,
              meaning: item.meaning,
              word_type: item.word_type,
              examples: item.examples,
              order: item.order,
            })),
            status: 'success',
            usage: response.usage,
          };
        } catch (error: any) {
          if (error instanceof RetryNeededException && attempt < maxRetries) {
            this.logger.warn(`Retrying vocabulary generation (attempt ${attempt + 2}/${maxRetries + 1})...`);
            continue;
          }
          if (attempt === maxRetries) {
            this.logger.error(`Failed to generate valid vocabulary after ${maxRetries + 1} attempts`, error.stack);
            throw new BadRequestException(
              `Failed to generate valid vocabulary items after ${maxRetries + 1} attempts. The AI response may be incomplete or invalid. Please try again or reduce the count.`,
            );
          }
          throw error;
        }
      }

      throw new BadRequestException('No valid vocabulary items generated from AI response');
    } catch (error: any) {
      this.logger.error(`Vocabulary generation error: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async createVocabularySet(
    topicId: string,
    topicSlug: string,
    setTitle: { vi: string; en: string; jp: string },
    description: string | null,
  ): Promise<VocabularySet> {
    const slug = this.generateSetSlug(setTitle.en, topicSlug);

    const vocabularySet = this.vocabularySetRepository.create({
      topic_id: topicId,
      slug,
      title: setTitle,
      description,
      order: 1,
    });

    return this.vocabularySetRepository.save(vocabularySet);
  }

  private generateSetSlug(titleEn: string, topicSlug: string): string {
    const cleanTitle = titleEn
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 30);
    
    return `${cleanTitle}-${topicSlug}-${Date.now()}`;
  }

  private validateVocabularyItems(items: any[]): any[] {
    const validItems: any[] = [];

    for (const item of items) {
      // Check required fields
      if (
        !item.romaji ||
        typeof item.romaji !== 'string' ||
        !item.kana ||
        typeof item.kana !== 'string' ||
        !item.meaning ||
        typeof item.meaning !== 'object' ||
        !item.meaning.vi ||
        !item.meaning.en ||
        !item.meaning.jp ||
        !item.word_type ||
        typeof item.word_type !== 'string' ||
        !Array.isArray(item.examples) ||
        item.examples.length === 0
      ) {
        this.logger.warn(`Skipping invalid vocabulary item: missing required fields`, JSON.stringify(item, null, 2));
        continue;
      }

      // Validate examples structure
      const validExamples = item.examples.filter(
        (ex: any) =>
          ex &&
          typeof ex === 'object' &&
          ex.sentence_jp &&
          ex.sentence_romaji &&
          ex.sentence_vi &&
          ex.sentence_en,
      );

      if (validExamples.length === 0) {
        this.logger.warn(`Skipping vocabulary item: no valid examples`, JSON.stringify(item, null, 2));
        continue;
      }

      validItems.push({
        romaji: item.romaji,
        kanji: item.kanji || null,
        kana: item.kana,
        meaning: {
          vi: item.meaning.vi,
          en: item.meaning.en,
          jp: item.meaning.jp,
        },
        word_type: item.word_type,
        examples: validExamples,
      });
    }

    return validItems;
  }

  private async saveVocabularyItemsWithSet(
    validItems: any[],
    topicId: string,
    vocabularySetId: string,
    levelCode: string,
    topicSlug: string,
  ): Promise<VocabularyItem[]> {
    const savedItems: VocabularyItem[] = [];
    const timestamp = Date.now();

    for (let i = 0; i < validItems.length; i++) {
      const itemData = validItems[i];
      const slug = this.generateSlugWithTimestamp(itemData.romaji, itemData.kana, i + 1, topicSlug, timestamp);

      // Check if item already exists (unlikely with timestamp)
      const existing = await this.vocabularyItemRepository.findOne({
        where: { slug },
      });

      if (existing) {
        this.logger.debug(`Vocabulary item with slug ${slug} already exists, skipping`);
        continue;
      }

      // Create new vocabulary item with vocabulary_set_id
      const vocabularyItem = this.vocabularyItemRepository.create({
        slug,
        topic_id: topicId,
        vocabulary_set_id: vocabularySetId,
        level_code: levelCode,
        romaji: itemData.romaji,
        kanji: itemData.kanji || null,
        kana: itemData.kana,
        meaning: {
          vi: itemData.meaning.vi,
          en: itemData.meaning.en,
          jp: itemData.meaning.jp,
        },
        word_type: itemData.word_type,
        title: null, // No individual titles, use set title instead
        examples: itemData.examples,
        order: i + 1,
      });

      const savedItem = await this.vocabularyItemRepository.save(vocabularyItem);
      savedItems.push(savedItem);
    }

    return savedItems;
  }

  private generateSlugWithTimestamp(romaji: string, kana: string, index: number, topicSlug: string, timestamp: number): string {
    const baseSlug = romaji
      ? romaji.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 30)
      : `vocab-${index}`;
    return `${topicSlug}-${baseSlug}-${timestamp}-${index}`;
  }

  private buildPrompt(topicSlug: string, count: number, levelCode: string): string {
    return `You are a Japanese language learning assistant. Generate a vocabulary SET with a title and vocabulary words for learning.

TOPIC: "${topicSlug}" (Japanese level: ${levelCode})
REQUIRED OUTPUT: 1 vocabulary set with exactly ${count} vocabulary items

CRITICAL: You MUST return ONLY a valid JSON object. No text before or after. No markdown code blocks. No explanations.

The JSON object MUST have these EXACT fields:
- set_title: object with vi, en, jp (descriptive title for this vocabulary set)
- items: array of ${count} vocabulary items

Each vocabulary item MUST have these EXACT fields:
- romaji: string (Romaji version, e.g., "konnichiwa")
- kanji: string or null (Kanji characters, use null if not applicable)
- kana: string (Hiragana/Katakana, e.g., "こんにちは")
- meaning: object with vi, en, jp (all strings)
- word_type: string (e.g., "noun", "verb", "adjective", "adverb", "interjection")
- examples: array of objects, each with sentence_jp, sentence_romaji, sentence_vi, sentence_en

EXAMPLE OUTPUT FORMAT (copy this exact structure):
{
  "set_title": {
    "vi": "Lời chào cơ bản",
    "en": "Basic Greetings",
    "jp": "基本的な挨拶"
  },
  "items": [
    {
      "romaji": "konnichiwa",
      "kanji": "今日は",
      "kana": "こんにちは",
      "meaning": {
        "vi": "xin chào",
        "en": "hello",
        "jp": "こんにちは"
      },
      "word_type": "interjection",
      "examples": [
        {
          "sentence_jp": "こんにちは、元気ですか？",
          "sentence_romaji": "Konnichiwa, genki desu ka?",
          "sentence_vi": "Xin chào, bạn khỏe không?",
          "sentence_en": "Hello, how are you?"
        }
      ]
    },
    {
      "romaji": "arigatou",
      "kanji": "ありがとう",
      "kana": "ありがとう",
      "meaning": {
        "vi": "cảm ơn",
        "en": "thank you",
        "jp": "ありがとう"
      },
      "word_type": "interjection",
      "examples": [
        {
          "sentence_jp": "ありがとうございます",
          "sentence_romaji": "Arigatou gozaimasu",
          "sentence_vi": "Cảm ơn bạn rất nhiều",
          "sentence_en": "Thank you very much"
        }
      ]
    }
  ]
}

RETURN ONLY THE JSON OBJECT - NO OTHER TEXT!`;
  }

  private buildRetryPrompt(basePrompt: string, count: number): string {
    return `You are a Japanese language learning assistant. Generate Japanese vocabulary words.

CRITICAL ERROR: Previous response had wrong format. You MUST return Japanese vocabulary items with these EXACT fields:
- romaji (string)
- kanji (string or null)
- kana (string)
- meaning (object with vi, en, jp strings)
- word_type (string like "noun", "verb", "interjection")
- examples (array of objects with sentence_jp, sentence_romaji, sentence_vi, sentence_en)

DO NOT return:
- Objects with id, name, age, city fields
- Generic data structures
- Wrong field names

DO return:
- Japanese vocabulary items ONLY
- EXACTLY ${count} items
- Valid JSON array format
- All required fields present

RETURN ONLY THE JSON ARRAY WITH JAPANESE VOCABULARY ITEMS - NO OTHER TEXT!`;
  }
}

