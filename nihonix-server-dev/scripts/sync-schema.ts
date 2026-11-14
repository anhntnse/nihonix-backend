/**
 * Sync Database Schema Script
 * 
 * Sử dụng TypeORM synchronize để tự động sync schema từ entities
 * An toàn hơn migration SQL vì đảm bảo 100% đúng với code
 * 
 * Usage:
 *   npm run sync:schema:prod
 */

import { config } from 'dotenv';
import { DataSource } from 'typeorm';

// Load environment variables
config({
  path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.develop',
});

// Import all entities
import { User } from '../src/modules/users/entity/user.entity';
import { UserAuth } from '../src/modules/auth/entity/user-auth.entity';
import { Session } from '../src/modules/auth/entity/session.entity';
import { VerificationToken } from '../src/modules/auth/entity/verification-token.entity';
import { Level } from '../src/modules/levels/entity/level.entity';
import { Topic } from '../src/modules/topics/entity/topic.entity';
import { GrammarSubTopic } from '../src/modules/grammar-sub-topics/entity/grammar-sub-topic.entity';
import { VocabularyItem } from '../src/modules/vocabulary-items/entity/vocabulary-item.entity';
import { GrammarPattern } from '../src/modules/grammar-patterns/entity/grammar-pattern.entity';
import { FlashcardFolder } from '../src/modules/flashcard-folders/entity/flashcard-folder.entity';
import { Flashcard } from '../src/modules/flashcards/entity/flashcard.entity';
import { FlashcardSet } from '../src/modules/flashcards/entity/flashcard-set.entity';
import { EntitySync } from '../src/modules/entity-sync/entity/entity-sync.entity';
import { UserLearningStreak } from '../src/modules/learning-streaks/entity/user-learning-streak.entity';
import { UserLearningActivity } from '../src/modules/learning-streaks/entity/user-learning-activity.entity';
import { VocabularySet } from '../src/modules/vocabulary-sets/entity/vocabulary-set.entity';
import { PracticeSession } from '../src/modules/practice/entity/practice-session.entity';
import { PracticeExercise } from '../src/modules/practice/entity/practice-exercise.entity';

async function syncSchema() {
  const host = process.env.DATABASE_HOST || 'localhost';
  const requiresSSL =
    host?.includes('neon.tech') ||
    host?.includes('supabase') ||
    host?.includes('aws.com') ||
    host?.includes('azure.com') ||
    host?.includes('digitalocean.com');

  const dataSource = new DataSource({
    type: 'postgres',
    host: host,
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'nihonix_db',
    entities: [
      User,
      UserAuth,
      Session,
      VerificationToken,
      Level,
      Topic,
      GrammarSubTopic,
      VocabularyItem,
      GrammarPattern,
      FlashcardFolder,
      FlashcardSet,
      Flashcard,
      EntitySync,
      UserLearningStreak,
      UserLearningActivity,
      VocabularySet,
      PracticeSession,
      PracticeExercise,
    ],
    synchronize: true, // Enable synchronize để tự động sync schema
    logging: true, // Log để xem TypeORM đang làm gì
    ssl: requiresSSL ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔄 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected!\n');

    console.log('🔄 TypeORM is synchronizing schema...');
    console.log('   (This will create/update tables based on your entities)\n');

    // TypeORM sẽ tự động sync khi initialize với synchronize: true
    // Chỉ cần đợi một chút để nó hoàn thành
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('✅ Schema synchronization completed!\n');

    // Verify tables
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    console.log(`📊 Total tables: ${tables.length}`);
    tables.forEach((t: any) => console.log(`  ✅ ${t.table_name}`));

    await dataSource.destroy();
    console.log('\n✅ Schema sync completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error syncing schema:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

syncSchema();

