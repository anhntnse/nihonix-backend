import { MigrationInterface,QueryRunner } from 'typeorm';
export class OfflineProgress1794700000000 implements MigrationInterface {
  async up(q:QueryRunner):Promise<void> {
    await q.query(`CREATE TABLE IF NOT EXISTS learning_progress (
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,item_type text NOT NULL,item_id text NOT NULL,status text NOT NULL,
      client_updated_at timestamptz NOT NULL,mutation_id uuid NOT NULL,version bigint NOT NULL,topic_id uuid NOT NULL,level_code text NOT NULL,
      PRIMARY KEY(user_id,item_type,item_id))`);
    await q.query(`CREATE TABLE IF NOT EXISTS progress_receipts (
      version bigserial PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      mutation_id uuid NOT NULL,payload_hash text NOT NULL,outcome jsonb NOT NULL,UNIQUE(user_id,mutation_id))`);
  }
  async down(q:QueryRunner):Promise<void> { await q.query('DROP TABLE IF EXISTS progress_receipts');await q.query('DROP TABLE IF EXISTS learning_progress'); }
}
