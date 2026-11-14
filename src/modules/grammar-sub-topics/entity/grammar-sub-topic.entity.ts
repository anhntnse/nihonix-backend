import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Topic } from '@topics/entity/topic.entity';
import { Level } from '@levels/entity/level.entity';

@Entity('grammar_sub_topics')
export class GrammarSubTopic {
  @PrimaryColumn({ type: 'text' })
  slug!: string;

  @Column({ type: 'uuid' })
  topic_id!: string;

  @Column({ type: 'text' })
  level_code!: string;

  @Column({ type: 'jsonb' })
  title!: {
    vi: string;
    en: string;
    jp: string;
  };

  @Column({ type: 'int', default: 1 })
  order!: number;

  // Relations
  @ManyToOne(() => Topic, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'topic_id', referencedColumnName: 'id' })
  topic!: Topic;

  @ManyToOne(() => Level, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'level_code', referencedColumnName: 'code' })
  level!: Level;
}

