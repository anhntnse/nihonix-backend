import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Flashcard } from '@flashcards/entity/flashcard.entity';
import { FlashcardSet } from '@flashcards/entity/flashcard-set.entity';
import { FlashcardFolder } from '@flashcard-folders/entity/flashcard-folder.entity';
import { BulkCreateFlashcardsDto } from '@flashcards/dto/bulk-create-flashcards.dto';
import { BulkUpdateFlashcardsDto } from '@flashcards/dto/bulk-update-flashcards.dto';
import { GenerateFlashcardsDto } from '@flashcards/dto/generate-flashcards.dto';
import { AiGenerationService } from '@ai/services/ai-generation.service';
import { AiJsonParserService } from '@ai/services/ai-json-parser.service';
import { RetryNeededException } from '@ai/exceptions/retry-needed.exception';
import {
  FLASHCARD_PROMPT_TEMPLATE,
  FLASHCARD_RETRY_PROMPT,
} from '../prompts/flashcards.prompt';

@Injectable()
export class FlashcardsService {
  private readonly logger = new Logger(FlashcardsService.name);

  constructor(
    @InjectRepository(Flashcard)
    private flashcardRepository: Repository<Flashcard>,
    @InjectRepository(FlashcardSet)
    private flashcardSetRepository: Repository<FlashcardSet>,
    @InjectRepository(FlashcardFolder)
    private flashcardFolderRepository: Repository<FlashcardFolder>,
    private dataSource: DataSource,
    private aiGenerationService: AiGenerationService,
    private aiJsonParserService: AiJsonParserService,
  ) {}

  /**
   * Get all flashcard sets in a folder
   */
  async getSetsByFolder(folderId: string): Promise<Array<{
    id: string;
    name: string;
    folder_id: string;
    order: number;
    card_count: number;
    created_at: Date;
    updated_at: Date;
  }>> {
    // Verify folder exists
    const folder = await this.flashcardFolderRepository.findOne({
      where: { id: folderId },
    });

    if (!folder) {
      throw new NotFoundException(`Folder with id ${folderId} not found`);
    }

    // Get all sets in folder with card count
    const sets = await this.flashcardSetRepository
      .createQueryBuilder('set')
      .leftJoin('set.flashcards', 'card')
      .where('set.folder_id = :folderId', { folderId })
      .select([
        'set.id',
        'set.name',
        'set.folder_id',
        'set.order',
        'set.created_at',
        'set.updated_at',
      ])
      .addSelect('COUNT(card.id)', 'card_count')
      .groupBy('set.id')
      .orderBy('set.order', 'ASC')
      .addOrderBy('set.created_at', 'ASC')
      .getRawMany();

    return sets.map(set => ({
      id: set.set_id,
      name: set.set_name,
      folder_id: set.set_folder_id,
      order: set.set_order,
      card_count: parseInt(set.card_count) || 0,
      created_at: set.set_created_at,
      updated_at: set.set_updated_at,
    }));
  }

  /**
   * Get all cards in a flashcard set
   */
  async getCardsBySet(setId: string): Promise<Flashcard[]> {
    // Verify set exists
    const set = await this.flashcardSetRepository.findOne({
      where: { id: setId },
    });

    if (!set) {
      throw new NotFoundException(`Flashcard set with id ${setId} not found`);
    }

    return this.flashcardRepository.find({
      where: { set_id: setId },
      order: { order: 'ASC', created_at: 'ASC' },
    });
  }

  /**
   * Delete a flashcard set (cascade delete all cards in the set)
   */
  async deleteSet(setId: string): Promise<void> {
    const set = await this.flashcardSetRepository.findOne({
      where: { id: setId },
    });

    if (!set) {
      throw new NotFoundException(`Flashcard set with id ${setId} not found`);
    }

    // Delete set (cards will be cascade deleted by foreign key constraint)
    await this.flashcardSetRepository.remove(set);
  }

  /**
   * Bulk create flashcards (creates set first, then cards)
   */
  async bulkCreate(bulkDto: BulkCreateFlashcardsDto): Promise<{ 
    set_id: string;
    set_name: string;
    created: number;
    cards: Flashcard[];
  }> {
    // Verify folder exists
    const folder = await this.flashcardFolderRepository.findOne({
      where: { id: bulkDto.folder_id },
    });

    if (!folder) {
      throw new NotFoundException(`Folder with id ${bulkDto.folder_id} not found`);
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Create FlashcardSet first
      const set = manager.create(FlashcardSet, {
        folder_id: bulkDto.folder_id,
        name: bulkDto.set_name,
        order: 1,
        slug: null,
      });
      const savedSet = await manager.save(FlashcardSet, set);

      // 2. Create all cards with set_id
      const cards = bulkDto.cards.map((cardDto, index) => 
        manager.create(Flashcard, {
          folder_id: bulkDto.folder_id,
          set_id: savedSet.id,
          front: cardDto.front,
          back: cardDto.back,
          order: cardDto.order ?? index + 1,
          slug: null,
        })
      );

      const savedCards = await manager.save(Flashcard, cards);

      return {
        set_id: savedSet.id,
        set_name: savedSet.name,
        created: savedCards.length,
        cards: savedCards,
      };
    });
  }

  /**
   * Bulk update flashcards in a set
   * - Cards with id will be updated
   * - Cards without id will be created
   * - Existing cards not in array will be deleted
   * - Optionally updates set name
   */
  async bulkUpdate(bulkDto: BulkUpdateFlashcardsDto): Promise<{
    set_id: string;
    set_name: string;
    created: number;
    updated: number;
    deleted: number;
    cards: Flashcard[];
  }> {
    // Verify set exists
    const set = await this.flashcardSetRepository.findOne({
      where: { id: bulkDto.set_id },
    });

    if (!set) {
      throw new NotFoundException(`Set with id ${bulkDto.set_id} not found`);
    }

    return this.dataSource.transaction(async (manager) => {
      // Update set name if provided
      if (bulkDto.set_name) {
        await manager.update(FlashcardSet, bulkDto.set_id, {
          name: bulkDto.set_name,
        });
        set.name = bulkDto.set_name;
      }

      // Get existing cards in set
      const existingCards = await manager.find(Flashcard, {
        where: { set_id: bulkDto.set_id },
      });

      const existingCardIds = existingCards.map(c => c.id);
      const requestCardIds = bulkDto.cards
        .filter(c => c.id)
        .map(c => c.id!);

      // Find cards to delete
      const cardsToDeleteIds = existingCardIds.filter(
        id => !requestCardIds.includes(id)
      );

      // Separate cards to create and update
      const cardsToCreate = bulkDto.cards.filter(c => !c.id);
      const cardsToUpdate = bulkDto.cards.filter(c => c.id);

      let createdCount = 0;
      let updatedCount = 0;
      let deletedCount = 0;

      // Delete removed cards
      if (cardsToDeleteIds.length > 0) {
        await manager.delete(Flashcard, cardsToDeleteIds);
        deletedCount = cardsToDeleteIds.length;
      }

      // Create new cards
      if (cardsToCreate.length > 0) {
        const newCards = cardsToCreate.map((cardDto, index) =>
          manager.create(Flashcard, {
            folder_id: set.folder_id,
            set_id: bulkDto.set_id,
            front: cardDto.front,
            back: cardDto.back,
            order: cardDto.order ?? (existingCards.length + index + 1),
            slug: null,
          })
        );
        await manager.save(Flashcard, newCards);
        createdCount = newCards.length;
      }

      // Update existing cards
      for (const cardDto of cardsToUpdate) {
        await manager.update(Flashcard, cardDto.id!, {
          front: cardDto.front,
          back: cardDto.back,
          order: cardDto.order,
        });
        updatedCount++;
      }

      // Get all cards in set after operations
      const finalCards = await manager.find(Flashcard, {
        where: { set_id: bulkDto.set_id },
        order: { order: 'ASC', created_at: 'ASC' },
      });

      return {
        set_id: set.id,
        set_name: set.name,
        created: createdCount,
        updated: updatedCount,
        deleted: deletedCount,
        cards: finalCards,
      };
    });
  }

  /**
   * Generate flashcards using AI
   */
  async generateFlashcards(dto: GenerateFlashcardsDto): Promise<{
    set_id: string;
    set_name: string;
    created: number;
    cards: Flashcard[];
    usage?: any;
  }> {
    try {
      const count = dto.count || 5;
      const levelCode = dto.level_code || 'N5';

      // Verify folder exists
      const folder = await this.flashcardFolderRepository.findOne({
        where: { id: dto.folder_id },
      });

      if (!folder) {
        throw new NotFoundException(`Folder with id ${dto.folder_id} not found`);
      }

      // Generate cards with AI
      const { cards, usage } = await this.generateCardsWithRetry(dto, count, levelCode);

      // Validate generated cards
      const { validCards, invalidCards } = this.validateCards(cards);

      if (validCards.length === 0) {
        const errorDetails = invalidCards.map(c => `Card ${c.index}: ${c.reason}`).join('; ');
        this.logger.error(`All ${cards.length} cards were invalid. Details:`, JSON.stringify(invalidCards, null, 2));
        throw new BadRequestException(
          `No valid cards could be generated. All ${cards.length} cards from AI response were missing required fields. Details: ${errorDetails}`,
        );
      }

      // Use bulkCreate to save the generated cards
      const bulkCreateDto: BulkCreateFlashcardsDto = {
        folder_id: dto.folder_id,
        set_name: dto.set_name,
        cards: validCards,
      };

      const result = await this.bulkCreate(bulkCreateDto);

      return {
        set_id: result.set_id,
        set_name: result.set_name,
        created: result.created,
        cards: result.cards,
        usage,
      };
    } catch (error: any) {
      this.logger.error(`Flashcard generation error: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async generateCardsWithRetry(
    dto: GenerateFlashcardsDto,
    count: number,
    levelCode: string,
  ): Promise<{ cards: any[]; usage: any }> {
    const basePrompt =
      dto.custom_prompt ||
      FLASHCARD_PROMPT_TEMPLATE({
        count,
        setName: dto.set_name,
        levelCode,
        difficulty: dto.difficulty,
        topic: dto.topic,
      });

    const maxRetries = 3;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const prompt = attempt === 0 ? basePrompt : FLASHCARD_RETRY_PROMPT(basePrompt, count);

        const response = await this.aiGenerationService.generateWithRetry({
          prompt,
          expectedCount: count,
          tokensPerItem: 300,
          maxRetries: 0,
        });

        const cards = this.aiJsonParserService.parseJson<any[]>(response.content, {
          expectedCount: count,
          allowRepair: true,
          arrayType: 'array',
        });

        return {
          cards,
          usage: response.usage,
        };
      } catch (error: any) {
        if (error instanceof RetryNeededException && attempt < maxRetries) {
          this.logger.warn(`Retrying flashcard generation (attempt ${attempt + 2}/${maxRetries + 1})...`);
          continue;
        }
        if (attempt === maxRetries) {
          this.logger.error(`Failed to generate valid cards after ${maxRetries + 1} attempts`, error.stack);
          throw new BadRequestException(
            `Failed to generate valid flashcards after ${maxRetries + 1} attempts. The AI response may be incomplete or invalid. Please try again or reduce the count.`,
          );
        }
        throw error;
      }
    }

    throw new BadRequestException('No valid cards generated from AI response');
  }

  private validateCards(cards: any[]): {
    validCards: any[];
    invalidCards: Array<{ index: number; reason: string; data: any }>;
  } {
    const validCards: any[] = [];
    const invalidCards: Array<{ index: number; reason: string; data: any }> = [];

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];

      // Validate front object
      if (!card.front || typeof card.front !== 'object') {
        invalidCards.push({
          index: i + 1,
          reason: `front is ${card.front === null ? 'null' : card.front === undefined ? 'undefined' : `invalid type: ${typeof card.front}`}`,
          data: card,
        });
        continue;
      }

      if (!card.front.text || typeof card.front.text !== 'string') {
        invalidCards.push({
          index: i + 1,
          reason: 'front.text is missing or not a string',
          data: card,
        });
        continue;
      }

      if (!card.front.type || typeof card.front.type !== 'string') {
        invalidCards.push({
          index: i + 1,
          reason: 'front.type is missing or not a string',
          data: card,
        });
        continue;
      }

      // Validate back object
      if (!card.back || typeof card.back !== 'object') {
        invalidCards.push({
          index: i + 1,
          reason: `back is ${card.back === null ? 'null' : card.back === undefined ? 'undefined' : `invalid type: ${typeof card.back}`}`,
          data: card,
        });
        continue;
      }

      if (!card.back.text || typeof card.back.text !== 'string') {
        invalidCards.push({
          index: i + 1,
          reason: 'back.text is missing or not a string',
          data: card,
        });
        continue;
      }

      if (!card.back.type || typeof card.back.type !== 'string') {
        invalidCards.push({
          index: i + 1,
          reason: 'back.type is missing or not a string',
          data: card,
        });
        continue;
      }

      // Validate order
      if (typeof card.order !== 'number') {
        invalidCards.push({
          index: i + 1,
          reason: 'order is missing or not a number',
          data: card,
        });
        continue;
      }

      validCards.push({
        front: card.front,
        back: card.back,
        order: card.order,
      });
    }

    return { validCards, invalidCards };
  }
}
