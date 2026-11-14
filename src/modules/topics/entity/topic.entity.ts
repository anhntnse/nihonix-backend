import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Level } from '@levels/entity/level.entity';

@Entity('topics')
export class Topic {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ type: 'text', unique: true })
    slug!: string;

    @Column({ type: 'text' })
    level_code!: string;

    @Column({ type: 'jsonb' })
    title!: {
        vi: string;
        en: string;
        jp: string;
    };

  @Column({ type: 'text', nullable: true })
  icon_svg!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'material' })
  icon_type!: string; // "material" or "svg"

  @Column({ type: 'int', nullable: true })
  icon_code!: number | null; // Material Icon codepoint (e.g., 58286 for movie)

  @Column({ type: 'int', default: 1 })
  order!: number;

    // Relations
    @ManyToOne(() => Level, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'level_code', referencedColumnName: 'code' })
    level!: Level;
}

