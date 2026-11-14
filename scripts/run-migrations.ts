/**
 * Script để chạy migrations an toàn
 * Sử dụng trong production deployment
 *
 * Chạy TypeORM migrations: npm run migration:run
 * Chạy SQL file: npm run migration:run migrations/add-flashcard-groups.sql
 */
import { AppDataSource } from '../data-source';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations() {
  try {
    console.log('🔄 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected!\n');

    // Check if SQL file path is provided
    const sqlFilePath = process.argv[2];
    
    if (sqlFilePath) {
      // Run SQL file
      const fullPath = path.resolve(process.cwd(), sqlFilePath);
      
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Migration file not found: ${fullPath}`);
      }

      console.log(`📂 Reading SQL file: ${fullPath}`);
      const sql = fs.readFileSync(fullPath, 'utf-8');

      console.log('🚀 Running SQL migration...');
      await AppDataSource.query(sql);
      console.log('✅ SQL migration completed successfully!');
      
    } else {
      // Run TypeORM migrations
      console.log('🔄 Running TypeORM migrations...');
      const migrations = await AppDataSource.runMigrations();

      if (migrations.length === 0) {
        console.log('✅ No pending migrations. Database is up to date!');
      } else {
        console.log(`✅ Successfully ran ${migrations.length} migration(s):`);
        migrations.forEach((migration) => {
          console.log(`   - ${migration.name}`);
        });
      }
    }

    await AppDataSource.destroy();
    console.log('\n✅ Migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migrations:', error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

runMigrations();
