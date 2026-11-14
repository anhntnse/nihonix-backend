import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { GrammarSubTopic } from '@grammar-sub-topics/entity/grammar-sub-topic.entity';
import { Topic } from '@topics/entity/topic.entity';
import { Level } from '@levels/entity/level.entity';

@Entity('grammar_patterns')
export class GrammarPattern {
    @PrimaryColumn({ type: 'text' })
    slug!: string;

    @Column({ type: 'text' })
    grammar_sub_topic_slug!: string;

    @Column({ type: 'text' })
    topic_slug!: string;

    @Column({ type: 'text' })
    level_code!: string;

    @Column({ type: 'text' })
    pattern_jp!: string;

    @Column({ type: 'text', nullable: true })
    pattern_romaji!: string | null;

    @Column({ type: 'jsonb' })
    explanation!: {
        vi: string;
        en: string;
        jp: string;
    };

    @Column({ type: 'jsonb', nullable: true })
    usage_examples!: Array<{
        sentence_jp: string;
        sentence_romaji: string;
        sentence_vi: string;
        sentence_en: string;
    }> | null;

    @Column({ type: 'jsonb', nullable: true })
    conjugation_rules!: Record<string, string> | null;

    @Column({ type: 'text', nullable: true })
    level_difficulty!: string | null;

    @Column({ type: 'jsonb', nullable: true })
    grammar_points!: string[] | null;

    @Column({ type: 'int', default: 1 })
    order!: number;

    // Relations
    @ManyToOne(() => GrammarSubTopic, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'grammar_sub_topic_slug', referencedColumnName: 'slug' })
    grammar_sub_topic!: GrammarSubTopic;

    @ManyToOne(() => Topic, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'topic_slug', referencedColumnName: 'slug' })
    topic!: Topic;

    @ManyToOne(() => Level, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
    })
    @JoinColumn({ name: 'level_code', referencedColumnName: 'code' })
    level!: Level;
}

