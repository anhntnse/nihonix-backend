import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GrammarPattern } from '@grammar-patterns/entity/grammar-pattern.entity';
import { GrammarSubTopic } from '@grammar-sub-topics/entity/grammar-sub-topic.entity';
import { GenerateGrammarDto } from '@grammar-patterns/dto';
import { AiGenerationService } from '@ai/services/ai-generation.service';
import { AiJsonParserService } from '@ai/services/ai-json-parser.service';
import { RetryNeededException } from '@ai/exceptions/retry-needed.exception';
import {
  GRAMMAR_PATTERN_PROMPT_TEMPLATE,
  GRAMMAR_PATTERN_RETRY_PROMPT,
} from '../prompts/grammar-patterns.prompt';

@Injectable()
export class GrammarPatternsService {
  private readonly logger = new Logger(GrammarPatternsService.name);

  constructor(
    @InjectRepository(GrammarPattern)
    private grammarPatternRepository: Repository<GrammarPattern>,
    @InjectRepository(GrammarSubTopic)
    private grammarSubTopicRepository: Repository<GrammarSubTopic>,
    private aiGenerationService: AiGenerationService,
    private aiJsonParserService: AiJsonParserService,
  ) {}

  async findAll(grammarSubTopicSlug?: string): Promise<GrammarPattern[]> {
    const where: any = {};
    if (grammarSubTopicSlug) where.grammar_sub_topic_slug = grammarSubTopicSlug;

    return this.grammarPatternRepository.find({
      where,
      order: { order: 'ASC' },
      relations: ['grammar_sub_topic', 'topic', 'level'],
    });
  }

  async findBySlug(slug: string): Promise<GrammarPattern> {
    const pattern = await this.grammarPatternRepository.findOne({
      where: { slug },
      relations: ['grammar_sub_topic', 'topic', 'level'],
    });

    if (!pattern) {
      throw new NotFoundException(`Grammar pattern with slug ${slug} not found`);
    }

    return pattern;
  }

  async findByGrammarSubTopic(grammarSubTopicSlug: string): Promise<GrammarPattern[]> {
    return this.grammarPatternRepository.find({
      where: { grammar_sub_topic_slug: grammarSubTopicSlug },
      order: { order: 'ASC' },
      relations: ['grammar_sub_topic', 'topic', 'level'],
    });
  }

  async generateGrammar(dto: GenerateGrammarDto): Promise<any> {
    try {
      const count = dto.count || 3;
      const levelCode = dto.level_code || 'N5';

      const grammarSubTopic = await this.grammarSubTopicRepository.findOne({
        where: { slug: dto.grammar_sub_topic_slug },
        relations: ['topic'],
      });

      if (!grammarSubTopic) {
        throw new NotFoundException(`Grammar sub-topic with slug ${dto.grammar_sub_topic_slug} not found`);
      }

      const { patterns, usage: aiUsage } = await this.generateWithRetry(dto, count, levelCode);
      const { validPatterns, invalidPatterns } = this.validatePatterns(patterns);
      const savedPatterns = await this.savePatterns(validPatterns, dto, grammarSubTopic.topic.slug, levelCode);

      if (savedPatterns.length === 0) {
        const errorDetails = invalidPatterns.map(p => `Pattern ${p.index}: ${p.reason}`).join('; ');
        this.logger.error(`All ${patterns.length} patterns were invalid. Details:`, JSON.stringify(invalidPatterns, null, 2));
        this.logger.error(`Sample pattern data:`, JSON.stringify(patterns[0], null, 2));
        throw new BadRequestException(
          `No valid patterns could be saved. All ${patterns.length} patterns from AI response were missing required fields. Details: ${errorDetails}`,
        );
      }

      return this.buildResponse(savedPatterns, dto, levelCode, aiUsage);
    } catch (error: any) {
      this.logger.error(`Grammar generation error: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async generateWithRetry(
    dto: GenerateGrammarDto,
    count: number,
    levelCode: string,
  ): Promise<{ patterns: any[]; usage: any }> {
    const basePrompt =
      dto.custom_prompt ||
      GRAMMAR_PATTERN_PROMPT_TEMPLATE({
        count,
        grammarSubTopicSlug: dto.grammar_sub_topic_slug,
        levelCode,
      });

    const maxRetries = 3;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const prompt = attempt === 0 ? basePrompt : GRAMMAR_PATTERN_RETRY_PROMPT(basePrompt, count);

        const response = await this.aiGenerationService.generateWithRetry({
          prompt,
          expectedCount: count,
          tokensPerItem: 800,
          maxRetries: 0, // We handle retry logic here
        });

        const patterns = this.aiJsonParserService.parseJson<any[]>(response.content, {
          expectedCount: count,
          allowRepair: true,
          arrayType: 'array',
        });

        return {
          patterns,
          usage: response.usage,
        };
      } catch (error: any) {
        if (error instanceof RetryNeededException && attempt < maxRetries) {
          this.logger.warn(`Retrying grammar generation (attempt ${attempt + 2}/${maxRetries + 1})...`);
          continue;
        }
        if (attempt === maxRetries) {
          this.logger.error(`Failed to generate valid patterns after ${maxRetries + 1} attempts`, error.stack);
          throw new BadRequestException(
            `Failed to generate valid grammar patterns after ${maxRetries + 1} attempts. The AI response may be incomplete or invalid. Please try again or reduce the count.`,
          );
        }
        throw error;
      }
    }

    throw new BadRequestException('No valid patterns generated from AI response');
  }

  private validatePatterns(patterns: any[]): {
    validPatterns: any[];
    invalidPatterns: Array<{ index: number; reason: string; data: any }>;
  } {
    const validPatterns: any[] = [];
    const invalidPatterns: Array<{ index: number; reason: string; data: any }> = [];

    for (let i = 0; i < patterns.length; i++) {
      const patternData = patterns[i];

      if (!patternData.pattern_jp || typeof patternData.pattern_jp !== 'string') {
        const reason = `pattern_jp is ${patternData.pattern_jp === null ? 'null' : patternData.pattern_jp === undefined ? 'undefined' : `invalid type: ${typeof patternData.pattern_jp}`}`;
        invalidPatterns.push({ index: i + 1, reason, data: patternData });
        continue;
      }

      if (!patternData.pattern_romaji || typeof patternData.pattern_romaji !== 'string') {
        const reason = `pattern_romaji is ${patternData.pattern_romaji === null ? 'null' : patternData.pattern_romaji === undefined ? 'undefined' : `invalid type: ${typeof patternData.pattern_romaji}`}`;
        invalidPatterns.push({ index: i + 1, reason, data: patternData });
        continue;
      }

      if (!patternData.explanation || typeof patternData.explanation !== 'object') {
        const reason = `explanation is ${patternData.explanation === null ? 'null' : patternData.explanation === undefined ? 'undefined' : `invalid type: ${typeof patternData.explanation}`}`;
        invalidPatterns.push({ index: i + 1, reason, data: patternData });
        continue;
      }

      const missingFields: string[] = [];
      if (!patternData.explanation.vi) missingFields.push('vi');
      if (!patternData.explanation.en) missingFields.push('en');
      if (!patternData.explanation.jp) missingFields.push('jp');

      if (missingFields.length > 0) {
        const reason = `explanation missing fields: ${missingFields.join(', ')}`;
        invalidPatterns.push({ index: i + 1, reason, data: patternData });
        continue;
      }

      if (!Array.isArray(patternData.usage_examples) || patternData.usage_examples.length < 2) {
        const reason = `usage_examples must be an array with at least 2 examples, got: ${patternData.usage_examples === null ? 'null' : patternData.usage_examples === undefined ? 'undefined' : `array with ${patternData.usage_examples?.length || 0} items`}`;
        invalidPatterns.push({ index: i + 1, reason, data: patternData });
        continue;
      }

      const invalidExamples = patternData.usage_examples.filter(
        (ex: any) =>
          !ex ||
          typeof ex !== 'object' ||
          !ex.sentence_jp ||
          !ex.sentence_romaji ||
          !ex.sentence_vi ||
          !ex.sentence_en,
      );

      if (invalidExamples.length > 0) {
        const reason = `usage_examples must be an array of objects with sentence_jp, sentence_romaji, sentence_vi, sentence_en fields. Found ${invalidExamples.length} invalid example(s)`;
        invalidPatterns.push({ index: i + 1, reason, data: patternData });
        continue;
      }

      if (!Array.isArray(patternData.grammar_points) || patternData.grammar_points.length < 2) {
        const reason = `grammar_points must be an array with at least 2 items, got: ${patternData.grammar_points === null ? 'null' : patternData.grammar_points === undefined ? 'undefined' : `array with ${patternData.grammar_points?.length || 0} items`}`;
        invalidPatterns.push({ index: i + 1, reason, data: patternData });
        continue;
      }

      validPatterns.push(patternData);
    }

    return { validPatterns, invalidPatterns };
  }

  private async savePatterns(
    validPatterns: any[],
    dto: GenerateGrammarDto,
    topicSlug: string,
    levelCode: string,
  ): Promise<GrammarPattern[]> {
    const savedPatterns: GrammarPattern[] = [];

    for (let i = 0; i < validPatterns.length; i++) {
      const patternData = validPatterns[i];
      const slug = this.generateSlug(patternData.pattern_jp, patternData.pattern_romaji || '', i + 1, dto.grammar_sub_topic_slug);

      const existing = await this.grammarPatternRepository.findOne({
        where: { slug },
      });

      if (existing) {
        continue;
      }

      const pattern = this.grammarPatternRepository.create({
        slug,
        grammar_sub_topic_slug: dto.grammar_sub_topic_slug,
        topic_slug: topicSlug,
        level_code: levelCode,
        pattern_jp: patternData.pattern_jp,
        pattern_romaji: patternData.pattern_romaji,
        explanation: {
          vi: patternData.explanation.vi,
          en: patternData.explanation.en,
          jp: patternData.explanation.jp,
        },
        usage_examples: patternData.usage_examples,
        conjugation_rules: patternData.conjugation_rules || null,
        grammar_points: patternData.grammar_points,
        level_difficulty: patternData.level_difficulty || null,
        order: i + 1,
      });

      const savedPattern = await this.grammarPatternRepository.save(pattern);
      savedPatterns.push(savedPattern);
    }

    return savedPatterns;
  }

  private generateSlug(patternJp: string, patternRomaji: string, index: number, grammarSubTopicSlug: string): string {
    const baseSlug = patternRomaji
      ? patternRomaji.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 50)
      : `pattern-${index}`;
    return `${grammarSubTopicSlug}-${baseSlug}-${index}`;
  }

  private buildResponse(savedPatterns: GrammarPattern[], dto: GenerateGrammarDto, levelCode: string, aiUsage: any) {
    return {
      grammar_sub_topic_slug: dto.grammar_sub_topic_slug,
      level_code: levelCode,
      count: savedPatterns.length,
      patterns: savedPatterns,
      status: 'success',
      usage: aiUsage,
    };
  }
}

