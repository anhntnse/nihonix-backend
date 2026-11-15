/**
 * Sprint 09 helper: revoke every session of one user in the local acceptance schema `sprint09_serve`,
 * to observe how the app reacts to a real 401 (AC-016 / OQ-021). Local database only, fixed schema.
 */
import 'reflect-metadata';
import assert from 'node:assert/strict';
import {DataSource} from 'typeorm';
import {AppDataSource} from '../data-source';

async function main() {
  assert.ok(['localhost', '127.0.0.1', '::1'].includes(String((AppDataSource.options as any).host).toLowerCase()), 'refusing non-local database');
  const username = process.argv[2] || 's09ui';
  assert.match(username, /^s09[a-z0-9]*$/, 'only s09* fixture users may be revoked');
  const schema = 'sprint09_serve';
  const db = new DataSource({
    ...AppDataSource.options, schema, synchronize: false, migrationsRun: false, logging: false,
    extra: {...(AppDataSource.options as any).extra, options: '-c search_path=' + schema},
  } as any);
  await db.initialize();
  try {
    const rows = await db.query('SELECT id FROM users WHERE username=$1', [username]);
    assert.equal(rows.length, 1, 'user not found');
    const deleted = await db.query('DELETE FROM sessions WHERE user_id=$1 RETURNING id', [rows[0].id]);
    console.log('REVOKED sessions=' + deleted.length + ' user=' + username);
  } finally {
    await db.destroy();
  }
}
main().catch(error => { console.error('FAIL revoke:', error?.message || error); process.exit(1); });
