import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '@users/entity/user.entity';

@Entity('user_auth')
export class UserAuth {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @Column({ type: 'varchar', nullable: false, select: false })
  password_hash: string;

  @Column({ type: 'int', default: 0 })
  token_version: number;

  // Relations
  @OneToOne(() => User, (user) => user.userAuth, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
