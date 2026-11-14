import { PartialType } from '@nestjs/swagger';
import { CreateFlashcardFolderDto } from './create-flashcard-folder.dto';

export class UpdateFlashcardFolderDto extends PartialType(CreateFlashcardFolderDto) {}

