import {MigrationInterface,QueryRunner} from 'typeorm';
export class AiPractice1794872800000 implements MigrationInterface {
 async up(q:QueryRunner):Promise<void>{
  await q.query(`CREATE TABLE IF NOT EXISTS ai_generation_requests(
   user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,request_id uuid NOT NULL,kind text NOT NULL,bucket text NOT NULL,day date NOT NULL,
   payload_hash text NOT NULL,state text NOT NULL,result jsonb,error_code text,error_status int,lease_expires_at timestamptz NOT NULL,
   created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(user_id,request_id))`);
  await q.query('CREATE INDEX IF NOT EXISTS idx_ai_request_quota ON ai_generation_requests(user_id,bucket,day,state)');
  await q.query(`CREATE TABLE IF NOT EXISTS practice_submissions(
   session_id uuid PRIMARY KEY REFERENCES practice_sessions(id) ON DELETE CASCADE,user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
   request_id uuid NOT NULL,payload_hash text NOT NULL,result jsonb NOT NULL,CONSTRAINT uq_practice_submission_request UNIQUE(user_id,request_id))`);
  await q.query(`CREATE TABLE IF NOT EXISTS practice_completion_events(
   id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,session_id uuid NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
   kind text NOT NULL DEFAULT 'practice_completed',completed_at timestamptz NOT NULL,duration_seconds int NOT NULL,schema_version int NOT NULL DEFAULT 1,
   payload jsonb NOT NULL,CONSTRAINT uq_practice_completion_session UNIQUE(session_id))`);
 }
 async down(q:QueryRunner):Promise<void>{
  await q.query('DROP TABLE IF EXISTS practice_completion_events');
  await q.query('DROP TABLE IF EXISTS practice_submissions');
  await q.query('DROP TABLE IF EXISTS ai_generation_requests');
 }
}
