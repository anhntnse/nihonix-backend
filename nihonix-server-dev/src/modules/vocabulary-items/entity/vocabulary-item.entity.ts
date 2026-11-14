import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Topic } from '@topics/entity/topic.entity';
import { Level } from '@levels/entity/level.entity';
import { VocabularySet } from '@vocabulary-sets/entity/vocabulary-set.entity';

@Entity('vocabulary_items')
export class VocabularyItem {
  @PrimaryColumn({ type: 'text' })
  slug!: string;

  @Column({ type: 'uuid' })
  topic_id!: string;

  @Column({ type: 'uuid', nullable: true })
  vocabulary_set_id!: string | null;

  @Column({ type: 'text' })
  level_code!: string;

  @Column({ type: 'text' })
  romaji!: string;

  @Column({ type: 'text', nullable: true })
  kanji!: string | null;

  @Column({ type: 'text' })
  kana!: string;

  @Column({ type: 'jsonb' })
  meaning!: {
    vi: string;
    en: string;
    jp: string;
  };

  @Column({ type: 'text' })
  word_type!: string;

  @Column({ type: 'jsonb', nullable: true })
  title!: {
    vi: string;
    en: string;
    jp: string;
  } | null;

  @Column({ type: 'jsonb', nullable: true })
  examples!: Array<{
    sentence_jp: string;
    sentence_romaji: string;
    sentence_vi: string;
    sentence_en: string;
  }> | null;

  @Column({ type: 'int', default: 1 })
  order!: number;

  // Relations
  @ManyToOne(() => Topic, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'topic_id', referencedColumnName: 'id' })
  topic!: Topic;

  @ManyToOne(() => VocabularySet, (set) => set.items, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'vocabulary_set_id', referencedColumnName: 'id' })
  vocabularySet!: VocabularySet | null;

  @ManyToOne(() => Level, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'level_code', referencedColumnName: 'code' })
  level!: Level;
}

