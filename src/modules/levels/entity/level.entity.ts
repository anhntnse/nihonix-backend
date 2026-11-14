import {
    Entity,
    PrimaryColumn,
    Column,
    UpdateDateColumn,
} from 'typeorm';

@Entity('levels')
export class Level {
    @PrimaryColumn({ type: 'text' })
    code!: 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

    @Column({ type: 'jsonb' })
    name!: {
        vi: string;
        en: string;
        jp: string;
    };

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at!: Date;
}

