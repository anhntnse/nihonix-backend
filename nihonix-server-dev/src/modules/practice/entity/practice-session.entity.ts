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
import { User } from '@users/entity/user.entity';
import { Topic } from '@topics/entity/topic.entity';
import { PracticeExercise } from './practice-exercise.entity';

@Entity('practice_sessions')
export class PracticeSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'uuid' })
  topic_id!: string;

  @Column({ type: 'varchar', length: 10 })
  level_code!: string;

  @Column({ type: 'int' })
  total_exercises!: number;

  @Column({ type: 'int', nullable: true })
  correct_count!: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  accuracy!: number | null;

  @Column({ type: 'int', nullable: true })
  total_time!: number | null; // seconds

  @Column({ type: 'varchar', length: 20, default: 'in_progress' })
  status!: string; // in_progress, completed

  @Column({ type: 'varchar', length: 50, nullable: true })
  exercise_type!: string | null; // fill_blank, multiple_choice

  @Column({ type: 'timestamptz', nullable: true })
  completed_at!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  // Relations
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user!: User;

  @ManyToOne(() => Topic, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'topic_id', referencedColumnName: 'id' })
  topic!: Topic;

  @OneToMany(() => PracticeExercise, (exercise) => exercise.session)
  exercises!: PracticeExercise[];
}


