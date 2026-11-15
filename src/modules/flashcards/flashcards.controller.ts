import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { FlashcardsService } from './services/flashcards.service';
import { 
  BulkCreateFlashcardsDto, 
  BulkUpdateFlashcardsDto,
  BulkCreateResponseDto,
  BulkUpdateResponseDto,
  GenerateFlashcardsDto,
} from './dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';

@ApiTags('Flashcards')
@ApiBearerAuth()
@Controller('flashcards')
@UseGuards(JwtAuthGuard)
export class FlashcardsController {
  constructor(private readonly flashcardsService: FlashcardsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Bulk create flashcards (creates set + cards)' })
  @ApiOkResponse({ 
    description: 'Flashcards created successfully',
    type: BulkCreateResponseDto,
  })
  async bulkCreate(@Body() bulkDto: BulkCreateFlashcardsDto, @Request() req) {
    const result = await this.flashcardsService.bulkCreate(bulkDto, req.user.id);
    
    // Remove set_id field from each card in response
    return {
      set_id: result.set_id,
      set_name: result.set_name,
      created: result.created,
      cards: result.cards.map(({ set_id, ...card }) => card),
    };
  }

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Generate flashcards using AI' })
  @ApiOkResponse({ 
    description: 'Flashcards generated successfully',
    type: BulkCreateResponseDto,
  })
  async generateFlashcards(@Body() generateDto: GenerateFlashcardsDto, @Request() req) {
    const result = await this.flashcardsService.generateFlashcards(generateDto, req.user.id);
    
    // Remove set_id field from each card in response
    return {
      set_id: result.set_id,
      set_name: result.set_name,
      created: result.created,
      cards: result.cards.map(({ set_id, ...card }) => card),
      usage: result.usage,
    };
  }

  @Put('bulk')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Bulk update flashcards in a set (create/update/delete)' })
  @ApiOkResponse({ 
    description: 'Flashcards updated successfully',
    type: BulkUpdateResponseDto,
  })
  async bulkUpdate(@Body() bulkDto: BulkUpdateFlashcardsDto, @Request() req) {
    const result = await this.flashcardsService.bulkUpdate(bulkDto, req.user.id);
    
    // Remove set_id field from each card in response
    return {
      set_id: result.set_id,
      set_name: result.set_name,
      created: result.created,
      updated: result.updated,
      deleted: result.deleted,
      cards: result.cards.map(({ set_id, ...card }) => card),
    };
  }

  @Get('sets')
  @ApiOperation({ summary: 'Get all flashcard sets in a folder' })
  @ApiOkResponse({ description: 'List of flashcard sets with card counts' })
  @ApiQuery({ name: 'folderId', required: true, description: 'Folder ID (UUID)' })
  async getSetsByFolder(@Query('folderId', ParseUUIDPipe) folderId: string, @Request() req) {
    return this.flashcardsService.getSetsByFolder(folderId, req.user.id);
  }

  @Get('sets/:setId/cards')
  @ApiOperation({ summary: 'Get all cards in a flashcard set' })
  @ApiOkResponse({ description: 'List of flashcards in the set' })
  @ApiParam({ name: 'setId', description: 'Flashcard Set ID (UUID)' })
  async getCardsBySet(@Param('setId', ParseUUIDPipe) setId: string, @Request() req) {
    return this.flashcardsService.getCardsBySet(setId, req.user.id);
  }

  @Delete('sets/:setId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a flashcard set (cascade delete all cards)' })
  @ApiOkResponse({ description: 'Flashcard set deleted successfully' })
  @ApiParam({ name: 'setId', description: 'Flashcard Set ID (UUID)' })
  async deleteSet(@Param('setId', ParseUUIDPipe) setId: string, @Request() req) {
    await this.flashcardsService.deleteSet(setId, req.user.id);
    return { message: 'Flashcard set deleted successfully' };
  }
}

