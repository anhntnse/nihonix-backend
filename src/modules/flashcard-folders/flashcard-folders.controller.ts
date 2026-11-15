import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { FlashcardFoldersService } from './services/flashcard-folders.service';
import { FlashcardFolder } from './entity/flashcard-folder.entity';
import { CreateFlashcardFolderDto, UpdateFlashcardFolderDto } from './dto';
import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';

@ApiTags('Flashcard Folders')
@ApiBearerAuth()
@Controller('flashcard-folders')
@UseGuards(JwtAuthGuard)
export class FlashcardFoldersController {
  constructor(private readonly flashcardFoldersService: FlashcardFoldersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create flashcard folder' })
  @ApiOkResponse({ description: 'Flashcard folder created successfully' })
  async create(@Body() createDto: CreateFlashcardFolderDto, @Request() req): Promise<FlashcardFolder> {
    return this.flashcardFoldersService.create(createDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all flashcard folders' })
  @ApiOkResponse({ description: 'List of flashcard folders' })
  async findAll(@Request() req): Promise<FlashcardFolder[]> {
    return this.flashcardFoldersService.findAll(req.user.id);
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get flashcard folder by ID or slug' })
  @ApiOkResponse({ description: 'Flashcard folder details' })
  @ApiParam({ name: 'idOrSlug', description: 'Flashcard folder ID (UUID) or slug' })
  async findOne(@Param('idOrSlug') idOrSlug: string, @Request() req): Promise<FlashcardFolder> {
    return this.flashcardFoldersService.findByIdOrSlug(idOrSlug, req.user.id);
  }

  @Put(':idOrSlug')
  @ApiOperation({ summary: 'Update flashcard folder' })
  @ApiOkResponse({ description: 'Flashcard folder updated successfully' })
  @ApiParam({ name: 'idOrSlug', description: 'Flashcard folder ID (UUID) or slug' })
  async update(
    @Param('idOrSlug') idOrSlug: string,
    @Body() updateDto: UpdateFlashcardFolderDto,
    @Request() req,
  ): Promise<FlashcardFolder> {
    return this.flashcardFoldersService.update(idOrSlug, updateDto, req.user.id);
  }

  @Delete(':idOrSlug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete flashcard folder' })
  @ApiOkResponse({ description: 'Flashcard folder deleted successfully' })
  @ApiParam({ name: 'idOrSlug', description: 'Flashcard folder ID (UUID) or slug' })
  async remove(@Param('idOrSlug') idOrSlug: string, @Request() req): Promise<{ message: string }> {
    await this.flashcardFoldersService.remove(idOrSlug, req.user.id);
    return { message: 'Flashcard folder deleted successfully' };
  }
}

