import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PracticeSession } from './practice-session.entity';

@Entity('practice_exercises')
export class PracticeExercise {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  session_id!: string;

  @Column({ type: 'varchar', length: 50 })
  type!: string; // fill_blank, multiple_choice, translation, sentence_order

  @Column({ type: 'jsonb' })
  question!: {
    text: string;
    hint?: string;
    context?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  options!: Array<{
    id: number;
    text: string;
  }> | null;

  @Column({ type: 'jsonb' })
  correct_answer!: any; // number or string or array

  @Column({ type: 'jsonb' })
  explanation!: {
    vi: string;
    en: string;
  };

  @Column({ type: 'text', array: true, nullable: true })
  vocabulary_tested!: string[] | null;

  @Column({ type: 'text', array: true, nullable: true })
  grammar_tested!: string[] | null;

  @Column({ type: 'jsonb', nullable: true })
  user_answer!: any | null;

  @Column({ type: 'boolean', nullable: true })
  is_correct!: boolean | null;

  @Column({ type: 'int', nullable: true })
  time_spent!: number | null; // seconds

  @Column({ type: 'int' })
  order_index!: number;

  // Relations
  @ManyToOne(() => PracticeSession, (session) => session.exercises, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id', referencedColumnName: 'id' })
  session!: PracticeSession;
}


