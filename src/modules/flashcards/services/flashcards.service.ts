import {randomUUID} from 'crypto';
import {FlashcardSyncService} from '../sync/flashcard-sync.service';
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
    private readonly sync: FlashcardSyncService,
  ) {}

  async getSetsByFolder(folderId:string,user:string):Promise<any[]> {
    return (await this.sync.sets(user,folderId)).map(({cards,...record})=>record);
  }
  async getCardsBySet(setId:string,user:string):Promise<Flashcard[]> {
    return (await this.sync.set(user,setId)).cards;
  }
  async deleteSet(setId:string,user:string):Promise<void> {
    const current=await this.sync.set(user,setId);
    await this.sync.legacy(user,{kind:'set',id:current.id,action:'delete',base_version:current.version});
  }
  async bulkCreate(dto:BulkCreateFlashcardsDto,user:string) {
    const folder=await this.sync.folder(user,dto.folder_id);
    const cards=dto.cards.map((card,index)=>({...card,id:card.id??randomUUID(),order:card.order??index+1}));
    const ack=await this.sync.legacy(user,{kind:'set',id:randomUUID(),action:'upsert',base_version:'0',
      folder_id:folder.id,name:dto.set_name,cards});
    return {set_id:ack.record.id,set_name:ack.record.name,created:ack.record.cards.length,cards:ack.record.cards};
  }
  async bulkUpdate(dto:BulkUpdateFlashcardsDto,user:string) {
    const current=await this.sync.set(user,dto.set_id);
    const existing=new Map<string,any>(current.cards.map((card:any)=>[card.id,card]));
    if(dto.cards.some(card=>card.id&&!existing.has(card.id.toLowerCase()))) throw new BadRequestException('A card ID does not belong to this set');
    const cards=dto.cards.map((card,index)=>({...card,id:card.id??randomUUID(),order:card.order??existing.get(card.id??'')?.order??index+1}));
    const ack=await this.sync.legacy(user,{kind:'set',id:current.id,action:'upsert',base_version:current.version,
      folder_id:current.folder_id,name:dto.set_name??current.name,order:current.order,cards});
    const updated=cards.filter(card=>existing.has(card.id.toLowerCase())).length;
    return {set_id:ack.record.id,set_name:ack.record.name,created:cards.length-updated,updated,
      deleted:ack.deleted_ids.cards.length,cards:ack.record.cards};
  }

  /**
   * Generate flashcards using AI
   */
  async generateFlashcards(dto: GenerateFlashcardsDto, user:string): Promise<{
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
        where: { id: dto.folder_id, user_id: user },
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

      const result = await this.bulkCreate(bulkCreateDto, user);

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
