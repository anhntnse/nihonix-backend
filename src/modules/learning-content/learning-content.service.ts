import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { createHash } from 'crypto';
import { Topic } from '../topics/entity/topic.entity';
import { VocabularyItem } from '../vocabulary-items/entity/vocabulary-item.entity';
import { VocabularySet } from '../vocabulary-sets/entity/vocabulary-set.entity';
import { GrammarSubTopic } from '../grammar-sub-topics/entity/grammar-sub-topic.entity';
import { GrammarPattern } from '../grammar-patterns/entity/grammar-pattern.entity';
import { ContentKind, contentKinds, LearningQueryDto } from './learning-query.dto';

export function contentVersion(data: unknown): string {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}
@Injectable()
export class LearningContentService {
  constructor(private readonly database: DataSource) {}
  async manifest() {
    return this.database.transaction('REPEATABLE READ',async manager=>{
      const collections:any[]=[];
      const definitions:any[]=[
        ['levels', (await import('../levels/entity/level.entity')).Level],
        ['topics',Topic],['vocabulary-items',VocabularyItem],['vocabulary-sets',VocabularySet],
        ['grammar-sub-topics',GrammarSubTopic],['grammar-patterns',GrammarPattern],
      ];
      for(const [kind,entity] of definitions) {
        const rows:any[]=await manager.getRepository(entity).find();
        const entries=rows.map(row=>({
          id:row.id || row.slug || row.code,slug:row.slug || row.code,level_code:row.level_code || row.code || null,
          topic_id:row.topic_id || null,topic_slug:row.topic_slug || null,title:row.title || row.name || null,
          version:contentVersion(row),
        })).sort((a,b)=>a.id.localeCompare(b.id));
        collections.push({kind,entries});
      }
      return {schema_version:1,collections,version:contentVersion(collections)};
    });
  }
  private kind(value: string): ContentKind {
    if (!(contentKinds as readonly string[]).includes(value)) throw new NotFoundException('Content collection not found');
    return value as ContentKind;
  }
  private entity(kind: ContentKind): any {
    return { 'vocabulary-items': VocabularyItem, 'vocabulary-sets': VocabularySet,
      'grammar-sub-topics': GrammarSubTopic, 'grammar-patterns': GrammarPattern }[kind];
  }
  private async parents(manager: EntityManager, kind: ContentKind, query: LearningQueryDto) {
    if (query.topic_id && !await manager.getRepository(Topic).existsBy({id:query.topic_id}))
      throw new NotFoundException('Topic not found');
    if (query.set_id) {
      if (kind !== 'vocabulary-items') throw new BadRequestException('set_id is only supported for vocabulary items');
      if (!await manager.getRepository(VocabularySet).existsBy({id:query.set_id})) throw new NotFoundException('Vocabulary set not found');
    }
    if (query.sub_topic_slug) {
      if (kind !== 'grammar-patterns') throw new BadRequestException('sub_topic_slug is only supported for grammar patterns');
      if (!await manager.getRepository(GrammarSubTopic).existsBy({slug:query.sub_topic_slug})) throw new NotFoundException('Grammar sub-topic not found');
    }
  }
  async page(value: string, query: LearningQueryDto) {
    const kind = this.kind(value);
    return this.database.transaction('REPEATABLE READ', async manager => {
      await this.parents(manager,kind,query);
      const builder = manager.getRepository(this.entity(kind)).createQueryBuilder('entry')
        .leftJoinAndSelect('entry.topic','topic');
      if (query.topic_id) builder.andWhere('topic.id = :topic',{topic:query.topic_id});
      if (query.level_code) builder.andWhere((kind === 'vocabulary-sets' ? 'topic' : 'entry')+'.level_code = :level',{level:query.level_code});
      if (query.set_id) builder.andWhere('entry.vocabulary_set_id = :set',{set:query.set_id});
      if (query.sub_topic_slug) builder.andWhere('entry.grammar_sub_topic_slug = :sub',{sub:query.sub_topic_slug});
      if (query.q) {
        const columns = kind === 'vocabulary-items' ? ['entry.kanji','entry.kana','entry.romaji',...['vi','en','jp'].map(l=>"entry.meaning->>'"+l+"'")] :
          kind === 'grammar-patterns' ? ['entry.pattern_jp','entry.pattern_romaji',...['vi','en','jp'].map(l=>"entry.explanation->>'"+l+"'")] :
          [...['vi','en','jp'].map(l=>"entry.title->>'"+l+"'"), ...(kind === 'vocabulary-sets' ? ['entry.description'] : [])];
        columns.push('entry.slug');
        const escaped = query.q.replace(/[\\%_]/g, char => '\\'+char);
        builder.andWhere('('+columns.map(c => c+' ILIKE :keyword').join(' OR ')+')',{keyword:'%'+escaped+'%'});
      }
      builder.orderBy('entry.order','ASC').addOrderBy('entry.slug','ASC');
      const [items,total] = await builder.skip((query.page-1)*query.page_size).take(query.page_size).getManyAndCount();
      const projected = await Promise.all(items.map(item => this.project(manager,kind,item)));
      const data = { schema_version:1,items:projected,total,page:query.page,page_size:query.page_size,
        has_more: query.page*query.page_size < total };
      return { ...data, version:contentVersion(data) };
    });
  }
  private async project(manager: EntityManager, kind: ContentKind, item: any) {
    if (kind === 'vocabulary-sets') return { ...item,level_code:item.topic.level_code,
      items_count:await manager.getRepository(VocabularyItem).countBy({vocabulary_set_id:item.id}) };
    if (kind === 'grammar-sub-topics') return { ...item,
      items_count:await manager.getRepository(GrammarPattern).countBy({grammar_sub_topic_slug:item.slug}) };
    return item;
  }
  async detail(value: string, identifier: string) {
    const kind = this.kind(value);
    if (kind === 'vocabulary-sets' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier))
      throw new BadRequestException('Vocabulary set identifier must be a UUID');
    return this.database.transaction('REPEATABLE READ', async manager => {
      const item = await manager.getRepository(this.entity(kind)).findOne({
        where: kind === 'vocabulary-sets' ? {id:identifier} : {slug:identifier}, relations:['topic'],
      });
      if (!item) throw new NotFoundException('Learning content not found');
      const data = { schema_version:1,...await this.project(manager,kind,item) };
      return { ...data,version:contentVersion(data) };
    });
  }
}
