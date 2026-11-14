import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlashcardFolder } from '@flashcard-folders/entity/flashcard-folder.entity';
import { CreateFlashcardFolderDto, UpdateFlashcardFolderDto } from '@flashcard-folders/dto';

@Injectable()
export class FlashcardFoldersService {
  constructor(
    @InjectRepository(FlashcardFolder)
    private flashcardFolderRepository: Repository<FlashcardFolder>,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 255);
  }

  private isUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  async create(createDto: CreateFlashcardFolderDto): Promise<FlashcardFolder> {
    // Always generate slug from name - BE tự tạo
    const slug = this.generateSlug(createDto.name);

    // Check if slug already exists
    const existing = await this.flashcardFolderRepository.findOne({
      where: { slug },
    });

    if (existing) {
      // If conflict, append timestamp to make unique
      const uniqueSlug = `${slug}-${Date.now()}`;
      const folder = this.flashcardFolderRepository.create({
        ...createDto,
        slug: uniqueSlug,
        order: createDto.order ?? 1,
      });
      return this.flashcardFolderRepository.save(folder);
    }

    const folder = this.flashcardFolderRepository.create({
      ...createDto,
      slug,
      order: createDto.order ?? 1,
    });
    return this.flashcardFolderRepository.save(folder);
  }

  async findAll(): Promise<FlashcardFolder[]> {
    return this.flashcardFolderRepository.find({
      order: { order: 'ASC', created_at: 'ASC' },
    });
  }

  async findById(id: string): Promise<FlashcardFolder> {
    const folder = await this.flashcardFolderRepository.findOne({
      where: { id },
    });

    if (!folder) {
      throw new NotFoundException(`Flashcard folder with id ${id} not found`);
    }

    return folder;
  }

  async findBySlug(slug: string): Promise<FlashcardFolder> {
    const folder = await this.flashcardFolderRepository.findOne({
      where: { slug },
    });

    if (!folder) {
      throw new NotFoundException(`Flashcard folder with slug ${slug} not found`);
    }

    return folder;
  }

  async findByIdOrSlug(idOrSlug: string): Promise<FlashcardFolder> {
    if (this.isUUID(idOrSlug)) {
      return this.findById(idOrSlug);
    }
    return this.findBySlug(idOrSlug);
  }

  async update(idOrSlug: string, updateDto: UpdateFlashcardFolderDto): Promise<FlashcardFolder> {
    const folder = await this.findByIdOrSlug(idOrSlug);

    // If name is being updated, regenerate slug automatically
    if (updateDto.name) {
      const newSlug = this.generateSlug(updateDto.name);
      // Check if new slug conflicts with existing (excluding current folder)
      const existing = await this.flashcardFolderRepository.findOne({
        where: { slug: newSlug },
      });
      if (existing && existing.id !== folder.id) {
        // If conflict, append timestamp to make unique
        (folder as any).slug = `${newSlug}-${Date.now()}`;
      } else {
        (folder as any).slug = newSlug;
      }
    }

    Object.assign(folder, updateDto);
    return this.flashcardFolderRepository.save(folder);
  }

  async remove(idOrSlug: string): Promise<void> {
    const folder = await this.findByIdOrSlug(idOrSlug);
    await this.flashcardFolderRepository.remove(folder);
  }
}

