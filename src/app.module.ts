import { ProgressModule } from './modules/progress/progress.module';
import { LearningContentModule } from './modules/learning-content/learning-content.module';
import { AppConfigController } from './app-config.controller';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { LevelsModule } from './modules/levels/levels.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TopicsModule } from './modules/topics/topics.module';
import { GrammarSubTopicsModule } from './modules/grammar-sub-topics/grammar-sub-topics.module';
import { FlashcardFoldersModule } from './modules/flashcard-folders/flashcard-folders.module';
import { FlashcardsModule } from './modules/flashcards/flashcards.module';
import { VocabularyItemsModule } from './modules/vocabulary-items/vocabulary-items.module';
import { GrammarPatternsModule } from './modules/grammar-patterns/grammar-patterns.module';
import { AiModule } from './modules/ai/ai.module';
import { EntitySyncModule } from './modules/entity-sync/entity-sync.module';
import { LearningStreaksModule } from './modules/learning-streaks/learning-streaks.module';
import { VocabularySetsModule } from './modules/vocabulary-sets/vocabulary-sets.module';
import { PracticeModule } from './modules/practice/practice.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? '.env.production'
          : '.env.develop',
    }),
    DatabaseModule,
    LevelsModule,
    LearningContentModule,
    ProgressModule,
    AuthModule,
    UsersModule,
    TopicsModule,
    GrammarSubTopicsModule,
    FlashcardFoldersModule,
    FlashcardsModule,
    VocabularyItemsModule,
    GrammarPatternsModule,
    AiModule,
    EntitySyncModule,
    LearningStreaksModule,
    VocabularySetsModule,
    PracticeModule,
  ],
  controllers: [AppController, AppConfigController],
  providers: [AppService],
})
export class AppModule {}
