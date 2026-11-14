import { MigrationInterface, QueryRunner } from 'typeorm';

/** Existing accounts must verify their email; do not silently mark them verified. */
export class SprintTwoAccounts1794614400000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified_at" timestamptz');
    await queryRunner.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "learning_settings" jsonb NOT NULL DEFAULT \'{}\'::jsonb');
    await queryRunner.query('ALTER TABLE "verification_tokens" ADD COLUMN IF NOT EXISTS "attempt_count" integer NOT NULL DEFAULT 0');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE "verification_tokens" DROP COLUMN IF EXISTS "attempt_count"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "learning_settings"');
    await queryRunner.query('ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verified_at"');
  }
}
