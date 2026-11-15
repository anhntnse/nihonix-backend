import 'dotenv/config';
import {AiGenerationRequest} from './src/modules/ai/ai-request.entity';
import {PracticeSubmission,PracticeCompletionEvent} from './src/modules/practice/entity/practice-submission.entity';
import {FlashcardSyncHead,FlashcardSyncReceipt} from './src/modules/flashcards/sync/flashcard-sync.entity';
import { LearningProgress, ProgressReceipt } from './src/modules/progress/progress.entity';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { register } from 'tsconfig-paths';
import * as path from 'path';

// Register path aliases for TypeORM CLI
try {
  const baseUrl = path.resolve(__dirname, './src');
  register({
    baseUrl,
    paths: {
      '@/*': ['/*'],
      '@common/*': ['common/*'],
      '@modules/*': ['modules/*'],
      '@config/*': ['config/*'],
      '@database/*': ['database/*'],
      '@decorators/*': ['common/decorators/*'],
      '@enums/*': ['common/enums/*'],
      '@auth/*': ['modules/auth/*'],
      '@users/*': ['modules/users/*'],
      '@levels/*': ['modules/levels/*'],
      '@topics/*': ['modules/topics/*'],
      '@grammar-sub-topics/*': ['modules/grammar-sub-topics/*'],
      '@vocabulary-items/*': ['modules/vocabulary-items/*'],
      '@grammar-patterns/*': ['modules/grammar-patterns/*'],
      '@flashcard-folders/*': ['modules/flashcard-folders/*'],
      '@flashcards/*': ['modules/flashcards/*'],
      '@entity-sync/*': ['modules/entity-sync/*'],
    },
  });
} catch (e) {
  // Ignore if already registered
}

// Load environment variables
config({
  path:
    process.env.NODE_ENV === 'production' ? '.env.production' : '.env.develop',
});

// Import all entities
import { User } from './src/modules/users/entity/user.entity';
import { UserAuth } from './src/modules/auth/entity/user-auth.entity';
import { Session } from './src/modules/auth/entity/session.entity';
import { VerificationToken } from './src/modules/auth/entity/verification-token.entity';
import { Level } from './src/modules/levels/entity/level.entity';
import { Topic } from './src/modules/topics/entity/topic.entity';
import { GrammarSubTopic } from './src/modules/grammar-sub-topics/entity/grammar-sub-topic.entity';
import { VocabularyItem } from './src/modules/vocabulary-items/entity/vocabulary-item.entity';
import { GrammarPattern } from './src/modules/grammar-patterns/entity/grammar-pattern.entity';
import { FlashcardFolder } from './src/modules/flashcard-folders/entity/flashcard-folder.entity';
import { Flashcard } from './src/modules/flashcards/entity/flashcard.entity';
import { FlashcardSet } from './src/modules/flashcards/entity/flashcard-set.entity';
import { EntitySync } from './src/modules/entity-sync/entity/entity-sync.entity';
import { UserLearningStreak } from './src/modules/learning-streaks/entity/user-learning-streak.entity';
import { UserLearningActivity } from './src/modules/learning-streaks/entity/user-learning-activity.entity';
import { VocabularySet } from './src/modules/vocabulary-sets/entity/vocabulary-set.entity';
import { PracticeSession } from './src/modules/practice/entity/practice-session.entity';
import { PracticeExercise } from './src/modules/practice/entity/practice-exercise.entity';

const host = process.env.DATABASE_HOST || 'localhost';
const requiresSSL = host?.includes('neon.tech');

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'nihonix_db',
  entities: [
    LearningProgress, ProgressReceipt, FlashcardSyncHead, FlashcardSyncReceipt, AiGenerationRequest, PracticeSubmission, PracticeCompletionEvent,
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
  migrations: [
    process.env.NODE_ENV === 'production'
      ? 'dist/src/database/migrations/*.js'
      : 'src/database/migrations/*.ts',
  ],
  migrationsRun: false,
  migrationsTableName: 'migrations',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl: requiresSSL ? { rejectUnauthorized: false } : false,
});
