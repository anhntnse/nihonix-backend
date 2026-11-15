import {MigrationInterface,QueryRunner} from 'typeorm';
export class PersonalFlashcards1794786400000 implements MigrationInterface {
  async up(q:QueryRunner):Promise<void> {
    // Existing folders have no trustworthy owner mapping: retain them as unowned.
    await q.query('ALTER TABLE flashcard_folders ADD COLUMN IF NOT EXISTS user_id uuid NULL');
    await q.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='flashcard_folders'::regclass AND contype='f'
        AND pg_get_constraintdef(oid) LIKE 'FOREIGN KEY (user_id)%') THEN
        ALTER TABLE flashcard_folders ADD CONSTRAINT fk_flashcard_folder_owner FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF; END $$`);
    await q.query('CREATE INDEX IF NOT EXISTS idx_flashcard_folder_owner ON flashcard_folders(user_id)');
    await q.query(`CREATE TABLE IF NOT EXISTS flashcard_sync_heads(
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,kind text NOT NULL,id uuid NOT NULL,
      version bigint NOT NULL,deleted boolean NOT NULL DEFAULT false,PRIMARY KEY(user_id,kind,id))`);
    await q.query(`CREATE TABLE IF NOT EXISTS flashcard_sync_receipts(
      version bigserial PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,mutation_id uuid NOT NULL,
      payload_hash text NOT NULL,outcome jsonb NOT NULL,UNIQUE(user_id,mutation_id))`);
    await q.query('CREATE INDEX IF NOT EXISTS idx_flashcard_receipt_cursor ON flashcard_sync_receipts(user_id,version)');
  }
  async down(q:QueryRunner):Promise<void> {
    await q.query('DROP TABLE IF EXISTS flashcard_sync_receipts');
    await q.query('DROP TABLE IF EXISTS flashcard_sync_heads');
    await q.query('ALTER TABLE flashcard_folders DROP COLUMN IF EXISTS user_id');
  }
}
