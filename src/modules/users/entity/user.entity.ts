import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserAuth } from '@auth/entity/user-auth.entity';
import { Session } from '@auth/entity/session.entity';
import { VerificationToken } from '@auth/entity/verification-token.entity';
import { Level } from '@levels/entity/level.entity';
import { UserRole } from '@enums/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, nullable: false })
  username: string;

  @Column({ type: 'varchar', unique: true, nullable: false })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  full_name: string;

  @Column({ type: 'varchar', nullable: true })
  avatar_url: string;

  @Column({ type: 'varchar', default: 'en' })
  language: string;

  @Column({ type: 'varchar', default: 'active' })
  status: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;

  @Column({ type: 'varchar', nullable: true })
  level_code!: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @OneToOne(() => UserAuth, (userAuth) => userAuth.user)
  userAuth: UserAuth;

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];

  @OneToMany(() => VerificationToken, (token) => token.user)
  verificationTokens: VerificationToken[];

  @ManyToOne(() => Level, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'level_code', referencedColumnName: 'code' })
  level!: Level | null;
}
