import {Injectable} from '@nestjs/common';
import {randomUUID} from 'crypto';
import {FlashcardSyncService} from '../../flashcards/sync/flashcard-sync.service';
import {CreateFlashcardFolderDto,UpdateFlashcardFolderDto} from '../dto';
@Injectable()
export class FlashcardFoldersService {
  constructor(private readonly sync:FlashcardSyncService) {}
  async create(dto:CreateFlashcardFolderDto,user:string) {
    return (await this.sync.legacy(user,{kind:'folder',id:randomUUID(),action:'upsert',base_version:'0',...dto})).record;
  }
  findAll(user:string) { return this.sync.folders(user); }
  findById(id:string,user:string) { return this.sync.folder(user,id); }
  findBySlug(slug:string,user:string) { return this.sync.folder(user,slug); }
  findByIdOrSlug(id:string,user:string) { return this.sync.folder(user,id); }
  async update(id:string,dto:UpdateFlashcardFolderDto,user:string) {
    const current=await this.sync.folder(user,id);
    return (await this.sync.legacy(user,{kind:'folder',id:current.id,action:'upsert',base_version:current.version,
      name:dto.name??current.name,description:dto.description??current.description??undefined,order:dto.order??current.order})).record;
  }
  async remove(id:string,user:string):Promise<void> {
    const current=await this.sync.folder(user,id);
    await this.sync.legacy(user,{kind:'folder',id:current.id,action:'delete',base_version:current.version});
  }
}
