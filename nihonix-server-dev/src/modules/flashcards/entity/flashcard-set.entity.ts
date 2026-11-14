import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FlashcardFolder } from '@flashcard-folders/entity/flashcard-folder.entity';
import { Flashcard } from './flashcard.entity';

@Entity('flashcard_sets')
export class FlashcardSet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  folder_id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', unique: true, nullable: true })
  slug!: string | null;

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

  @OneToMany(() => Flashcard, (flashcard) => flashcard.set)
  flashcards!: Flashcard[];
}
