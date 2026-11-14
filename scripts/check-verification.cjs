// Read-only database diagnosis for the explicitly supplied test address.
require('dotenv').config({ path: '.env.develop', quiet: true });
const { Client } = require('pg');
async function run() {
  const email = process.argv[2] || 'helloanhne@gmail.com';
  const db = new Client({ host: process.env.DATABASE_HOST || 'localhost',
    port: Number(process.env.DATABASE_PORT || 5432), user: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD, database: process.env.DATABASE_NAME || 'nihonix_db',
    connectionTimeoutMillis: 10000, statement_timeout: 10000 });
  let user;
  try {
    await db.connect();
    await db.query('BEGIN READ ONLY');
    const columns = await db.query("SELECT table_name,column_name FROM information_schema.columns WHERE table_schema=current_schema() AND ((table_name='users' AND column_name='email_verified_at') OR (table_name='verification_tokens' AND column_name='attempt_count'))");
    console.log(JSON.stringify({ accountMigrationColumns: columns.rows }));
    if (columns.rowCount === 2) {
      const result = await db.query('SELECT id, email_verified_at FROM users WHERE lower(email)=lower($1)', [email]);
      user = result.rows[0];
      console.log(JSON.stringify({ testAccountExists: !!user, emailAlreadyVerified: user ? !!user.email_verified_at : null }));
      if (user) {
        const tokens = await db.query("SELECT created_at,expires_at,used_at,attempt_count FROM verification_tokens WHERE user_id=$1 AND type='email_verification' ORDER BY created_at DESC LIMIT 1", [user.id]);
        console.log(JSON.stringify({ latestVerificationChallenge: tokens.rows[0] || null }));
      }
    }
    await db.query('ROLLBACK');
  } catch (e) {
    console.error(JSON.stringify({ stage: 'read-only verification diagnosis', code: e.code || e.name }));
    process.exitCode = 1;
  } finally { await db.end(); }
  try {
    const health = await fetch('http://localhost:3010/api/health', { signal: AbortSignal.timeout(10000) });
    console.log(JSON.stringify({ localBackendHealthStatus: health.status }));
    if (!user || !user.email_verified_at) {
      const response = await fetch('http://localhost:3010/api/auth/request-email-verification', {
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email}),
        signal:AbortSignal.timeout(90000)
      });
      console.log(JSON.stringify({ verificationRequestStatus:response.status, response:await response.json() }));
    }
  } catch (e) { console.error(JSON.stringify({ stage:'local verification API', code:e.cause?.code || e.name })); process.exitCode=1; }
}
run();
