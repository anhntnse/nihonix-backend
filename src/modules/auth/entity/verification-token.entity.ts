import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '@users/entity/user.entity';

@Entity('verification_tokens')
export class VerificationToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  user_id: string;

  @Column({ type: 'varchar', nullable: false })
  type: string; // 'email_verification', 'password_reset', etc.

  @Column({ type: 'varchar', nullable: false })
  token_hash: string;

  @Column({ type: 'timestamp', nullable: false })
  expires_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  used_at: Date;

  @Column({ type: 'integer', default: 0 })
  attempt_count: number;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.verificationTokens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
