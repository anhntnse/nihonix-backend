import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { User } from '@users/entity/user.entity';

@Entity('sessions')
export class Session {
  @PrimaryColumn('varchar')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  user_id: string;

  @Column({ type: 'varchar', nullable: true })
  refresh_token_hash: string;

  @Column({ type: 'varchar', nullable: true })
  user_agent: string;

  @Column({ type: 'varchar', nullable: true })
  ip: string;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;

  @CreateDateColumn()
  created_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
