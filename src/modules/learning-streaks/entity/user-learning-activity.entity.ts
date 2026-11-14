import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from '@users/entity/user.entity';

@Entity('user_learning_activities')
@Unique(['user_id', 'activity_date'])
export class UserLearningActivity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'date' })
  activity_date!: Date;

  @Column({ type: 'int', default: 0 })
  activity_count!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  activity_type!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  // Relations
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user!: User;
}

