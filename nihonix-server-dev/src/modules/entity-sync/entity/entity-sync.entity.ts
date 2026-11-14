import {
  Entity,
  PrimaryColumn,
  Column,
} from 'typeorm';

export enum EntityKind {
  LEVEL = 'level',
  TOPIC = 'topic',
  // GRAMMAR_SUB_TOPIC = 'grammar_sub_topic',
  // VOCABULARY_ITEM = 'vocabulary_item',
  // GRAMMAR_PATTERN = 'grammar_pattern',
  // FLASHCARD_FOLDER = 'flashcard_folder',
  // FLASHCARD = 'flashcard',
}

@Entity('entity_sync')
export class EntitySync {
  @PrimaryColumn({ type: 'enum', enum: EntityKind })
  entity_kind!: EntityKind;

  @PrimaryColumn({ type: 'text' })
  entity_key!: string;

  @Column({ type: 'text' })
  row_etag!: string;

  @Column({ type: 'timestamptz' })
  updated_at!: Date;

  @Column({ type: 'boolean', default: false })
  is_deleted!: boolean;

  @Column({ type: 'text', nullable: true })
  moved_to_key!: string | null;
}

