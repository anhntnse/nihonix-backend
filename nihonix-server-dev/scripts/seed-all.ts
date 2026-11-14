/**
 * Master seed script - Seed tất cả data cần thiết
 *
 * Local: npm run seed
 * Production: npm run seed:prod
 *
 * Thứ tự seed:
 * 1. Admin user
 * 2. Levels (N5, N4, N3, N2, N1)
 * 3. Topics (25 topics mỗi level)
 * 4. Grammar sub-topics (8 topics mỗi level)
 *
 * Lưu ý: Script tự động detect environment từ NODE_ENV
 * - Development: đọc .env.develop
 * - Production: đọc .env.production
 */
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../src/modules/users/entity/user.entity';

// Load environment variables first
config({
  path:
    process.env.NODE_ENV === 'production' ? '.env.production' : '.env.develop',
});
import {
  UserAuth,
  Session,
  VerificationToken,
} from '../src/modules/auth/entity';
import { Level } from '../src/modules/levels/entity/level.entity';
import { Topic } from '../src/modules/topics/entity/topic.entity';
import { GrammarSubTopic } from '../src/modules/grammar-sub-topics/entity/grammar-sub-topic.entity';
import { VocabularyItem } from '../src/modules/vocabulary-items/entity/vocabulary-item.entity';
import { GrammarPattern } from '../src/modules/grammar-patterns/entity/grammar-pattern.entity';
import { VocabularySet } from '../src/modules/vocabulary-sets/entity/vocabulary-set.entity';
import { UserRole } from '../src/common/enums/user-role.enum';

// Import seed data
import {
  levelsSeedData,
  topicsSeedData,
  grammarSubTopicsSeedData,
} from '../src/services/seed/seed-data';
import { detailedGrammarSubTopicsData } from '../src/services/seed/grammar-sub-topics-detailed.data';
import { topicIconsData } from '../src/services/seed/topic-icons.data';
import { vocabularyItemsSeedData } from '../src/services/seed/vocabulary-items.data';
import { grammarPatternsSeedData } from '../src/services/seed/grammar-patterns.data';

async function ensureColumnExists(
  dataSource: DataSource,
  tableName: string,
  columnName: string,
  columnDefinition: string,
) {
  const columnExists = await dataSource.query(
    `
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1 
      AND column_name = $2
    )
  `,
    [tableName, columnName],
  );

  if (!columnExists[0]?.exists) {
    console.log(
      `⚠️  Column ${tableName}.${columnName} does not exist. Creating it...`,
    );
    await dataSource.query(
      `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${columnName} ${columnDefinition}`,
    );
    console.log(`✅ Column ${tableName}.${columnName} created`);
  }
}

async function ensureTableExists(
  dataSource: DataSource,
  tableName: string,
  createTableSQL: string,
) {
  const tableExists = await dataSource.query(
    `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    )
  `,
    [tableName],
  );

  if (!tableExists[0]?.exists) {
    console.log(`⚠️  Table ${tableName} does not exist. Creating it...`);
    await dataSource.query(createTableSQL);
    console.log(`✅ Table ${tableName} created`);
  }
}

async function ensureSchema(dataSource: DataSource) {
  // Create enum type if not exists
  await dataSource.query(`
    DO $$ BEGIN
      CREATE TYPE user_role_enum AS ENUM('user', 'admin');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // Create levels table
  await ensureTableExists(
    dataSource,
    'levels',
    `
    CREATE TABLE IF NOT EXISTS levels (
      code text NOT NULL,
      name jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT PK_levels PRIMARY KEY (code),
      CONSTRAINT CHK_levels_code CHECK (code IN ('N5','N4','N3','N2','N1'))
    )
  `,
  );

  // Create users table
  await ensureTableExists(
    dataSource,
    'users',
    `
    CREATE TABLE IF NOT EXISTS users (
      id uuid NOT NULL DEFAULT uuid_generate_v4(),
      username varchar NOT NULL,
      email varchar NOT NULL,
      full_name varchar,
      avatar_url varchar,
      language varchar NOT NULL DEFAULT 'en',
      status varchar NOT NULL DEFAULT 'active',
      role user_role_enum NOT NULL DEFAULT 'user',
      level_code varchar,
      created_at timestamp NOT NULL DEFAULT now(),
      updated_at timestamp NOT NULL DEFAULT now(),
      CONSTRAINT UQ_users_username UNIQUE (username),
      CONSTRAINT UQ_users_email UNIQUE (email),
      CONSTRAINT PK_users PRIMARY KEY (id),
      CONSTRAINT FK_users_level FOREIGN KEY (level_code) REFERENCES levels(code) ON DELETE SET NULL ON UPDATE CASCADE
    )
  `,
  );

  // Ensure all required columns exist in users
  await ensureColumnExists(
    dataSource,
    'users',
    'role',
    "user_role_enum NOT NULL DEFAULT 'user'",
  );
  await ensureColumnExists(dataSource, 'users', 'level_code', 'varchar');

  // Create user_auth table
  await ensureTableExists(
    dataSource,
    'user_auth',
    `
    CREATE TABLE IF NOT EXISTS user_auth (
      user_id uuid NOT NULL,
      password_hash varchar NOT NULL,
      token_version integer NOT NULL DEFAULT 0,
      CONSTRAINT PK_user_auth PRIMARY KEY (user_id),
      CONSTRAINT FK_user_auth_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,
  );

  // Create sessions table
  await ensureTableExists(
    dataSource,
    'sessions',
    `
    CREATE TABLE IF NOT EXISTS sessions (
      id varchar NOT NULL,
      user_id uuid NOT NULL,
      refresh_token_hash varchar,
      user_agent varchar,
      ip varchar,
      expires_at timestamp,
      created_at timestamp NOT NULL DEFAULT now(),
      CONSTRAINT PK_sessions PRIMARY KEY (id),
      CONSTRAINT FK_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,
  );

  // Create verification_tokens table
  await ensureTableExists(
    dataSource,
    'verification_tokens',
    `
    CREATE TABLE IF NOT EXISTS verification_tokens (
      id uuid NOT NULL DEFAULT uuid_generate_v4(),
      user_id uuid NOT NULL,
      type varchar NOT NULL,
      token_hash varchar NOT NULL,
      expires_at timestamp NOT NULL,
      used_at timestamp,
      created_at timestamp NOT NULL DEFAULT now(),
      CONSTRAINT PK_verification_tokens PRIMARY KEY (id),
      CONSTRAINT FK_verification_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,
  );

  // Create topics table
  await ensureTableExists(
    dataSource,
    'topics',
    `
    CREATE TABLE IF NOT EXISTS topics (
      slug text NOT NULL,
      level_code text NOT NULL,
      title jsonb NOT NULL,
      icon_svg text,
      "order" integer NOT NULL DEFAULT 1,
      CONSTRAINT PK_topics PRIMARY KEY (slug),
      CONSTRAINT FK_topics_level FOREIGN KEY (level_code) REFERENCES levels(code) ON UPDATE CASCADE
    )
  `,
  );

  // Create grammar_sub_topics table
  await ensureTableExists(
    dataSource,
    'grammar_sub_topics',
    `
    CREATE TABLE IF NOT EXISTS grammar_sub_topics (
      slug text NOT NULL,
      topic_slug text NOT NULL,
      level_code text NOT NULL,
      title jsonb NOT NULL,
      "order" integer NOT NULL DEFAULT 1,
      CONSTRAINT PK_grammar_sub_topics PRIMARY KEY (slug),
      CONSTRAINT FK_grammar_sub_topics_topic FOREIGN KEY (topic_slug) REFERENCES topics(slug) ON DELETE CASCADE,
      CONSTRAINT FK_grammar_sub_topics_level FOREIGN KEY (level_code) REFERENCES levels(code) ON UPDATE CASCADE
    )
  `,
  );

  // Create vocabulary_items table
  await ensureTableExists(
    dataSource,
    'vocabulary_items',
    `
    CREATE TABLE IF NOT EXISTS vocabulary_items (
      slug text NOT NULL,
      topic_slug text NOT NULL,
      level_code text NOT NULL,
      romaji text NOT NULL,
      kanji text,
      kana text NOT NULL,
      meaning jsonb NOT NULL,
      word_type text NOT NULL,
      examples jsonb,
      "order" integer NOT NULL DEFAULT 1,
      CONSTRAINT PK_vocabulary_items PRIMARY KEY (slug),
      CONSTRAINT FK_vocabulary_items_topic FOREIGN KEY (topic_slug) REFERENCES topics(slug) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT FK_vocabulary_items_level FOREIGN KEY (level_code) REFERENCES levels(code) ON DELETE CASCADE ON UPDATE CASCADE
    )
  `,
  );

  // Create grammar_patterns table
  await ensureTableExists(
    dataSource,
    'grammar_patterns',
    `
    CREATE TABLE IF NOT EXISTS grammar_patterns (
      slug text NOT NULL,
      grammar_sub_topic_slug text NOT NULL,
      topic_slug text NOT NULL,
      level_code text NOT NULL,
      pattern_jp text NOT NULL,
      pattern_romaji text,
      explanation jsonb NOT NULL,
      usage_examples jsonb,
      conjugation_rules jsonb,
      level_difficulty text,
      grammar_points jsonb,
      "order" integer NOT NULL DEFAULT 1,
      CONSTRAINT PK_grammar_patterns PRIMARY KEY (slug),
      CONSTRAINT FK_grammar_patterns_grammar_sub_topic FOREIGN KEY (grammar_sub_topic_slug) REFERENCES grammar_sub_topics(slug) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT FK_grammar_patterns_topic FOREIGN KEY (topic_slug) REFERENCES topics(slug) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT FK_grammar_patterns_level FOREIGN KEY (level_code) REFERENCES levels(code) ON DELETE CASCADE ON UPDATE CASCADE
    )
  `,
  );

  // Create entity_kind enum for entity_sync
  await dataSource.query(`
    DO $$ BEGIN
      CREATE TYPE entity_kind AS ENUM('level', 'topic');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // Create entity_sync table
  await ensureTableExists(
    dataSource,
    'entity_sync',
    `
    CREATE TABLE IF NOT EXISTS entity_sync (
      entity_kind entity_kind NOT NULL,
      entity_key text NOT NULL,
      row_etag text NOT NULL,
      updated_at timestamptz NOT NULL,
      is_deleted boolean NOT NULL DEFAULT false,
      moved_to_key text,
      CONSTRAINT PK_entity_sync PRIMARY KEY (entity_kind, entity_key)
    )
  `,
  );

  // Create flashcard_folders table
  await ensureTableExists(
    dataSource,
    'flashcard_folders',
    `
    CREATE TABLE IF NOT EXISTS flashcard_folders (
      id uuid NOT NULL DEFAULT uuid_generate_v4(),
      slug text UNIQUE,
      name text NOT NULL,
      description text,
      "order" integer NOT NULL DEFAULT 1,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT PK_flashcard_folders PRIMARY KEY (id)
    )
  `,
  );

  // Create flashcards table
  await ensureTableExists(
    dataSource,
    'flashcards',
    `
    CREATE TABLE IF NOT EXISTS flashcards (
      id uuid NOT NULL DEFAULT uuid_generate_v4(),
      slug text UNIQUE,
      folder_id uuid NOT NULL,
      front jsonb NOT NULL,
      back jsonb NOT NULL,
      "order" integer NOT NULL DEFAULT 1,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT PK_flashcards PRIMARY KEY (id),
      CONSTRAINT FK_flashcards_folder FOREIGN KEY (folder_id) REFERENCES flashcard_folders(id) ON DELETE CASCADE ON UPDATE CASCADE
    )
  `,
  );

  console.log('✅ All required tables and columns verified');
}

async function seedAll() {
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
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD,
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
      VocabularySet,
    ],
    synchronize: false,
    ssl: requiresSSL ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🚀 Starting master seed process...\n');
    console.log('🔌 Connecting to database...');
    await dataSource.initialize();
    console.log('✅ Connected!\n');

    // Ensure schema exists (check and create missing columns)
    await ensureSchema(dataSource);

    // 1. SEED ADMIN
    console.log('═══════════════════════════════════════');
    console.log('1️⃣  SEEDING ADMIN USER');
    console.log('═══════════════════════════════════════');
    await seedAdmin(dataSource);

    // 2. SEED LEVELS
    console.log('\n═══════════════════════════════════════');
    console.log('2️⃣  SEEDING LEVELS');
    console.log('═══════════════════════════════════════');
    await seedLevels(dataSource);

    // 3. SEED TOPICS
    console.log('\n═══════════════════════════════════════');
    console.log('3️⃣  SEEDING TOPICS');
    console.log('═══════════════════════════════════════');
    await seedTopics(dataSource);

    // 4. SEED GRAMMAR SUB-TOPICS
    console.log('\n═══════════════════════════════════════');
    console.log('4️⃣  SEEDING GRAMMAR SUB-TOPICS');
    console.log('═══════════════════════════════════════');
    await seedGrammarSubTopics(dataSource);

    // 5. SEED DETAILED GRAMMAR SUB-TOPICS (Minna no Nihongo)
    console.log('\n═══════════════════════════════════════');
    console.log('5️⃣  SEEDING DETAILED GRAMMAR SUB-TOPICS');
    console.log('═══════════════════════════════════════');
    await seedDetailedGrammarSubTopics(dataSource);

    // 6. SEED VOCABULARY ITEMS
    console.log('\n═══════════════════════════════════════');
    console.log('6️⃣  SEEDING VOCABULARY ITEMS');
    console.log('═══════════════════════════════════════');
    await seedVocabularyItems(dataSource);

    // 7. SEED GRAMMAR PATTERNS
    console.log('\n═══════════════════════════════════════');
    console.log('7️⃣  SEEDING GRAMMAR PATTERNS');
    console.log('═══════════════════════════════════════');
    await seedGrammarPatterns(dataSource);

    // FINAL SUMMARY
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║  ✅ ALL SEEDS COMPLETED SUCCESSFULLY! ║');
    console.log('╚═══════════════════════════════════════╝');
    console.log('\n📊 Summary:');
    console.log('  ✅ Admin user seeded');
    console.log('  ✅ Levels seeded (N5, N4, N3)');
    console.log('  ✅ Topics seeded');
    console.log('  ✅ Grammar sub-topics seeded');
    console.log('  ✅ Vocabulary items seeded');
    console.log('  ✅ Grammar patterns seeded');
    console.log('\n🔑 Admin credentials:');
    console.log('  📧 Email:    admin@nihonix.com');
    console.log('  👤 Username: admin');
    console.log('  🔑 Password: Admin@123456');
    console.log('  ⚠️  Change password after first login!\n');
  } catch (error) {
    console.error('\n❌ Error during seed process:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('🔌 Database connection closed.\n');
  }
}

async function seedAdmin(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);
  const userAuthRepo = dataSource.getRepository(UserAuth);

  // Use raw query to check if admin exists (safer - doesn't require all columns)
  const existingAdmin = await dataSource.query(
    `SELECT id, username, email FROM users WHERE username = $1 OR email = $2 LIMIT 1`,
    ['admin', 'admin@nihonix.com'],
  );

  if (existingAdmin && existingAdmin.length > 0) {
    console.log('⚠️  Admin already exists, skipping...');
    return;
  }

  const hashedPassword = await bcrypt.hash('Admin@123456', 12);

  // Build INSERT query - level_code will be handled by ensureSchema if needed
  const result = await dataSource.query(
    `INSERT INTO users (username, email, full_name, status, language, role, level_code, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     RETURNING id`,
    [
      'admin',
      'admin@nihonix.com',
      'System Administrator',
      'active',
      'vi',
      'admin', // UserRole.ADMIN
      null, // level_code
    ],
  );

  const adminUserId = result[0]?.id;
  if (!adminUserId) {
    throw new Error('Failed to create admin user');
  }

  console.log('✅ Admin user created');

  // Insert user_auth using raw query
  await dataSource.query(
    `INSERT INTO user_auth (user_id, password_hash, token_version)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO NOTHING`,
    [adminUserId, hashedPassword, 0],
  );

  console.log('✅ Admin auth created');
}

async function seedLevels(dataSource: DataSource) {
  const levelRepo = dataSource.getRepository(Level);

  for (const levelData of levelsSeedData) {
    const existing = await levelRepo.findOne({
      where: { code: levelData.code },
    });

    if (!existing) {
      await levelRepo.save(levelData);
      console.log(`✅ Level ${levelData.code} seeded`);
    } else {
      console.log(`⚠️  Level ${levelData.code} already exists, skipping...`);
    }
  }
}

async function seedTopics(dataSource: DataSource) {
  const topicRepo = dataSource.getRepository(Topic);
  let totalSeeded = 0;
  let totalSkipped = 0;
  let totalUpdated = 0;

  for (const [levelCode, topics] of Object.entries(topicsSeedData)) {
    const iconData = (topicIconsData as any)[levelCode] || [];
    
    for (const topicData of topics) {
      const existing = await topicRepo.findOne({
        where: { slug: topicData.slug },
      });

      // Find icon data for this topic
      const icon = iconData.find((i: any) => i.slug === topicData.slug);

      if (!existing) {
        await topicRepo.save({
          ...topicData,
          level_code: levelCode,
          icon_type: icon?.icon_type || 'material',
          icon_code: icon?.icon_code || null,
        });
        totalSeeded++;
        console.log(`  ✓ Seeded: ${topicData.slug} with icon ${icon?.icon_code || 'none'}`);
      } else {
        // Update existing topic with icon data if not set
        if (!existing.icon_code && icon) {
          existing.icon_type = icon.icon_type;
          existing.icon_code = icon.icon_code;
          await topicRepo.save(existing);
          totalUpdated++;
          console.log(`  ↻ Updated icon for: ${topicData.slug} (${icon.icon_code})`);
        } else {
          totalSkipped++;
        }
      }
    }
  }

  console.log(`✅ Topics seeded: ${totalSeeded} new, ${totalUpdated} updated, ${totalSkipped} skipped`);
}

async function seedGrammarSubTopics(dataSource: DataSource) {
  const grammarRepo = dataSource.getRepository(GrammarSubTopic);
  const topicRepo = dataSource.getRepository(Topic);
  let totalSeeded = 0;
  let totalSkipped = 0;

  const topicGrammarMapping = {
    N5: {
      'basic-patterns': ['greetings', 'daily-activities', 'school'],
      particles: ['time', 'places', 'directions'],
      verbs: ['daily-activities', 'food', 'hobbies'],
      adjectives: ['colors', 'weather', 'emotions'],
      questions: ['family', 'shopping', 'work'],
      negation: ['food', 'health', 'transportation'],
      'past-tense': ['daily-activities', 'travel', 'school'],
      desire: ['food', 'hobbies', 'shopping'],
    },
    N4: {
      causative: ['relationships', 'work', 'education'],
      passive: ['communication', 'media', 'entertainment'],
      potential: ['sports', 'technology', 'business'],
      conditional: ['shopping-advanced', 'banking', 'healthcare'],
      honorifics: ['business', 'education', 'relationships'],
      comparison: ['entertainment', 'sports', 'housing'],
      'giving-receiving': ['relationships', 'business', 'communication'],
      progressive: ['work', 'cooking', 'education'],
    },
    N3: {
      'causative-passive': ['business', 'economy', 'politics'],
      'complex-sentences': ['academic', 'literature', 'culture'],
      'formal-expressions': ['business', 'politics', 'academic'],
      'indirect-speech': ['literature', 'communication', 'culture'],
      conjunctions: ['economy', 'science', 'history'],
      'adverbial-clauses': ['philosophy', 'academic', 'literature'],
      modality: ['politics', 'philosophy', 'culture'],
      nominalization: ['academic', 'science', 'literature'],
    },
  };

  for (const [levelCode, grammarTopics] of Object.entries(
    topicGrammarMapping,
  )) {
    for (const [grammarSlug, topicSlugs] of Object.entries(grammarTopics)) {
      const grammarData = grammarSubTopicsSeedData[
        levelCode as keyof typeof grammarSubTopicsSeedData
      ]?.find((g) => g.slug === grammarSlug);

      if (grammarData) {
        for (const topicSlug of topicSlugs) {
          // Find topic by slug to get its id
          const topic = await topicRepo.findOne({
            where: { slug: topicSlug },
          });

          if (!topic) {
            console.warn(`⚠️  Topic with slug ${topicSlug} not found, skipping grammar sub-topic`);
            continue;
          }

          const existing = await grammarRepo.findOne({
            where: {
              slug: `${grammarSlug}-${topicSlug}`,
            },
          });

          if (!existing) {
            await grammarRepo.save({
              slug: `${grammarSlug}-${topicSlug}`,
              topic_id: topic.id,
              level_code: levelCode,
              title: grammarData.title,
              order: grammarData.order,
            });
            totalSeeded++;
          } else {
            totalSkipped++;
          }
        }
      }
    }
  }

  console.log(
    `✅ Grammar sub-topics seeded: ${totalSeeded} new, ${totalSkipped} skipped`,
  );
}

/**
 * Seed detailed grammar sub-topics based on Minna no Nihongo
 */
async function seedDetailedGrammarSubTopics(dataSource: DataSource) {
  const grammarRepo = dataSource.getRepository(GrammarSubTopic);
  const topicRepo = dataSource.getRepository(Topic);
  let totalSeeded = 0;
  let totalSkipped = 0;

  // Seed N5 data
  for (const [topicSlug, grammarSubTopics] of Object.entries(
    detailedGrammarSubTopicsData.N5,
  )) {
    // Find topic by slug to get its ID
    const topic = await topicRepo.findOne({
      where: { slug: topicSlug },
    });

    if (!topic) {
      console.log(
        `⚠️  Topic with slug ${topicSlug} not found, skipping grammar sub-topics`,
      );
      continue;
    }

    // Seed each grammar sub-topic for this topic
    for (const grammarData of grammarSubTopics as any[]) {
      const slug = `${grammarData.slug || grammarData.grammar_type}-${topicSlug}`;

      const existing = await grammarRepo.findOne({
        where: { slug },
      });

      if (!existing) {
        await grammarRepo.save({
          slug,
          topic_id: topic.id,
          level_code: 'N5',
          title: grammarData.title,
          order: grammarData.order,
        });
        totalSeeded++;
        console.log(`  ✓ Seeded: ${slug}`);
      } else {
        totalSkipped++;
      }
    }
  }

  console.log(
    `✅ Detailed grammar sub-topics seeded: ${totalSeeded} new, ${totalSkipped} skipped`,
  );
}

async function seedVocabularyItems(dataSource: DataSource) {
  const vocabRepo = dataSource.getRepository(VocabularyItem);
  const setRepo = dataSource.getRepository(VocabularySet);
  const topicRepo = dataSource.getRepository(Topic);

  let totalSeeded = 0;
  let totalSkipped = 0;

  for (const itemData of vocabularyItemsSeedData) {
    const topic = await topicRepo.findOne({
      where: { slug: itemData.topic_slug },
    });

    if (!topic) {
      continue;
    }

    let vocabSet = await setRepo.findOne({
      where: { topic_id: topic.id, slug: `set-${itemData.topic_slug}` },
    });

    if (!vocabSet) {
      vocabSet = await setRepo.save({
        slug: `set-${itemData.topic_slug}`,
        topic_id: topic.id,
        title: topic.title,
        description: `Từ vựng chủ đề ${itemData.topic_slug}`,
        order: 1,
      });
    }

    const existing = await vocabRepo.findOne({
      where: { slug: itemData.slug },
    });

    if (!existing) {
      await vocabRepo.save({
        slug: itemData.slug,
        topic_id: topic.id,
        vocabulary_set_id: vocabSet.id,
        level_code: itemData.level_code,
        romaji: itemData.romaji,
        kanji: itemData.kanji,
        kana: itemData.kana,
        meaning: itemData.meaning,
        word_type: itemData.word_type,
        title: null,
        examples: itemData.examples,
        order: itemData.order,
      });
      totalSeeded++;
      console.log(`  ✓ Seeded: ${itemData.slug}`);
    } else {
      totalSkipped++;
    }
  }

  console.log(
    `✅ Vocabulary items seeded: ${totalSeeded} new, ${totalSkipped} skipped`,
  );
}

async function seedGrammarPatterns(dataSource: DataSource) {
  const patternRepo = dataSource.getRepository(GrammarPattern);
  const subTopicRepo = dataSource.getRepository(GrammarSubTopic);
  const topicRepo = dataSource.getRepository(Topic);

  let totalSeeded = 0;
  let totalSkipped = 0;

  for (const patternData of grammarPatternsSeedData) {
    const topic = await topicRepo.findOne({
      where: { slug: patternData.topic_slug },
    });

    if (!topic) {
      continue;
    }

    const subTopic = await subTopicRepo.findOne({
      where: { slug: patternData.grammar_sub_topic_slug },
    });

    if (!subTopic) {
      continue;
    }

    const existing = await patternRepo.findOne({
      where: { slug: patternData.slug },
    });

    if (!existing) {
      await patternRepo.save({
        slug: patternData.slug,
        grammar_sub_topic_slug: patternData.grammar_sub_topic_slug,
        topic_slug: patternData.topic_slug,
        level_code: patternData.level_code,
        pattern_jp: patternData.pattern_jp,
        pattern_romaji: patternData.pattern_romaji,
        explanation: patternData.explanation,
        usage_examples: patternData.usage_examples,
        conjugation_rules: patternData.conjugation_rules,
        level_difficulty: patternData.level_difficulty,
        grammar_points: patternData.grammar_points,
        order: patternData.order,
      });
      totalSeeded++;
      console.log(`  ✓ Seeded: ${patternData.slug}`);
    } else {
      totalSkipped++;
    }
  }

  console.log(
    `✅ Grammar patterns seeded: ${totalSeeded} new, ${totalSkipped} skipped`,
  );
}

// Run seed
seedAll();
