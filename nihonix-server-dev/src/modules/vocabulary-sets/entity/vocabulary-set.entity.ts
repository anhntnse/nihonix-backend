import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Topic } from '@topics/entity/topic.entity';
import { VocabularyItem } from '@vocabulary-items/entity/vocabulary-item.entity';

@Entity('vocabulary_sets')
export class VocabularySet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  topic_id!: string;

  @Column({ type: 'text', unique: true })
  slug!: string;

  @Column({ type: 'jsonb' })
  title!: {
    vi: string;
    en: string;
    jp: string;
  };

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'int', default: 1 })
  order!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  // Relations
  @ManyToOne(() => Topic, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'topic_id', referencedColumnName: 'id' })
  topic!: Topic;

  @OneToMany(() => VocabularyItem, (item) => item.vocabularySet, {
    cascade: true,
  })
  items!: VocabularyItem[];
}

