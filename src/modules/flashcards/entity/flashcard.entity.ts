import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FlashcardFolder } from '@flashcard-folders/entity/flashcard-folder.entity';
import { FlashcardSet } from './flashcard-set.entity';

@Entity('flashcards')
export class Flashcard {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', unique: true, nullable: true })
  slug!: string | null;

  @Column({ type: 'uuid' })
  folder_id!: string;

  @Column({ type: 'uuid' })
  set_id!: string;

  @Column({ type: 'jsonb' })
  front!: any;

  @Column({ type: 'jsonb' })
  back!: any;

  @Column({ type: 'int', default: 1 })
  order!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  // Relations
  @ManyToOne(() => FlashcardFolder, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'folder_id', referencedColumnName: 'id' })
  folder!: FlashcardFolder;

  @ManyToOne(() => FlashcardSet, (set) => set.flashcards, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'set_id', referencedColumnName: 'id' })
  set!: FlashcardSet;
}

