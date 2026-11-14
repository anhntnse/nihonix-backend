import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables from correct file
config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.develop',
});

async function runSqlMigration() {
  const migrationFile = process.argv[2];
  
  if (!migrationFile) {
    console.error('❌ Please provide migration file path');
    console.log('Usage: npm run migration:sql migrations/add-flashcard-groups.sql');
    process.exit(1);
  }

  const fullPath = path.resolve(process.cwd(), migrationFile);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Migration file not found: ${fullPath}`);
    process.exit(1);
  }

  console.log(`📂 Reading migration file: ${fullPath}`);
  const sql = fs.readFileSync(fullPath, 'utf-8');

  // Create DataSource
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'nihonix_db',
    synchronize: false, // Don't auto-sync during migration
  });

  try {
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected to database');

    console.log('🚀 Running migration...');
    await dataSource.query(sql);
    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

runSqlMigration();
