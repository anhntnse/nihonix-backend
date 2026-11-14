import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@users/entity/user.entity';

@Entity('user_learning_streaks')
export class UserLearningStreak {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'int', default: 0 })
  current_streak!: number;

  @Column({ type: 'int', default: 0 })
  longest_streak!: number;

  @Column({ type: 'date', nullable: true })
  last_learned_date!: Date | null;

  @Column({ type: 'date', nullable: true })
  streak_start_date!: Date | null;

  @Column({ type: 'int', default: 0 })
  total_learning_days!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  // Relations
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user!: User;
}

