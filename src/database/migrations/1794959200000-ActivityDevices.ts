import {MigrationInterface,QueryRunner} from 'typeorm';
export class ActivityDevices1794959200000 implements MigrationInterface{
 async up(q:QueryRunner):Promise<void>{
  await q.query(`CREATE TABLE IF NOT EXISTS learning_activity_events(
   user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,id uuid NOT NULL,payload_hash text NOT NULL,
   activity_type text NOT NULL,occurred_at timestamptz NOT NULL,duration_seconds integer NOT NULL,timezone text NOT NULL,
   item_id text,slices jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(user_id,id))`);
  await q.query('CREATE INDEX IF NOT EXISTS idx_activity_owner_time ON learning_activity_events(user_id,occurred_at)');
  await q.query(`CREATE TABLE IF NOT EXISTS notification_devices(
   installation_id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   session_id varchar NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,binding_id uuid NOT NULL,token text NOT NULL,
   enabled boolean NOT NULL,updated_at timestamptz NOT NULL DEFAULT now())`);
  await q.query('CREATE UNIQUE INDEX IF NOT EXISTS uq_notification_token ON notification_devices(token)');
  await q.query(`CREATE TABLE IF NOT EXISTS reminder_attempts(
   user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,day date NOT NULL,id uuid NOT NULL,status text NOT NULL,
   created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(user_id,day))`);
 }
 async down(q:QueryRunner):Promise<void>{await q.query('DROP TABLE IF EXISTS reminder_attempts');await q.query('DROP TABLE IF EXISTS notification_devices');await q.query('DROP TABLE IF EXISTS learning_activity_events');}
}
