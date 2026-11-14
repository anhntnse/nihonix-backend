# Database Schema Checklist - Đảm bảo 100% không thiếu sót

## ✅ Entities trong data-source.ts (12 entities)

1. ✅ **User** → `users` table
2. ✅ **UserAuth** → `user_auth` table
3. ✅ **Session** → `sessions` table
4. ✅ **VerificationToken** → `verification_tokens` table
5. ✅ **Level** → `levels` table
6. ✅ **Topic** → `topics` table
7. ✅ **GrammarSubTopic** → `grammar_sub_topics` table
8. ✅ **VocabularyItem** → `vocabulary_items` table
9. ✅ **GrammarPattern** → `grammar_patterns` table
10. ✅ **FlashcardFolder** → `flashcard_folders` table
11. ✅ **Flashcard** → `flashcards` table
12. ✅ **EntitySync** → `entity_sync` table

## ✅ Enums

1. ✅ `user_role_enum` ('user', 'admin')
2. ✅ `entity_kind` ('level', 'topic')

## ✅ Tables được tạo trong ensureSchema()

1. ✅ `levels` - với CHECK constraint cho code
2. ✅ `users` - với role enum, level_code FK
3. ✅ `user_auth` - với FK đến users
4. ✅ `sessions` - với nullable refresh_token_hash, expires_at
5. ✅ `verification_tokens` - với FK đến users
6. ✅ `topics` - với FK đến levels
7. ✅ `grammar_sub_topics` - với FK đến topics và levels
8. ✅ `vocabulary_items` - với FK đến topics và levels
9. ✅ `grammar_patterns` - với FK đến grammar_sub_topics, topics, levels
10. ✅ `entity_sync` - với composite PK (entity_kind, entity_key)
11. ✅ `flashcard_folders` - với uuid PK
12. ✅ `flashcards` - với FK đến flashcard_folders

## ✅ Foreign Keys

1. ✅ `users.level_code` → `levels.code` (SET NULL, CASCADE)
2. ✅ `user_auth.user_id` → `users.id` (CASCADE)
3. ✅ `sessions.user_id` → `users.id` (CASCADE)
4. ✅ `verification_tokens.user_id` → `users.id` (CASCADE)
5. ✅ `topics.level_code` → `levels.code` (CASCADE)
6. ✅ `grammar_sub_topics.topic_slug` → `topics.slug` (CASCADE)
7. ✅ `grammar_sub_topics.level_code` → `levels.code` (CASCADE)
8. ✅ `vocabulary_items.topic_slug` → `topics.slug` (CASCADE)
9. ✅ `vocabulary_items.level_code` → `levels.code` (CASCADE)
10. ✅ `grammar_patterns.grammar_sub_topic_slug` → `grammar_sub_topics.slug` (CASCADE)
11. ✅ `grammar_patterns.topic_slug` → `topics.slug` (CASCADE)
12. ✅ `grammar_patterns.level_code` → `levels.code` (CASCADE)
13. ✅ `flashcards.folder_id` → `flashcard_folders.id` (CASCADE)

## ✅ Constraints

1. ✅ `users.username` UNIQUE
2. ✅ `users.email` UNIQUE
3. ✅ `levels.code` CHECK (IN ('N5','N4','N3','N2','N1'))
4. ✅ `flashcard_folders.slug` UNIQUE
5. ✅ `flashcards.slug` UNIQUE
6. ✅ `entity_sync` composite PRIMARY KEY

## ✅ Column Types Match Entities

- ✅ All UUID columns use `uuid` type
- ✅ All JSONB columns use `jsonb` type
- ✅ All timestamps use `timestamp` or `timestamptz`
- ✅ All nullable columns match entity definitions
- ✅ All default values match entity definitions

## ✅ Test Results

- ✅ Script chạy thành công với production database
- ✅ Tất cả tables được tạo tự động
- ✅ Seed data thành công
- ✅ Không có lỗi schema mismatch

## 🎯 Kết luận

**100% ĐẦY ĐỦ - KHÔNG THIẾU SÓT**

Tất cả 12 entities đều có table tương ứng với đầy đủ:

- Columns đúng type và nullable
- Foreign keys đúng relationships
- Constraints đúng business rules
- Enums được tạo đúng

Script `ensureSchema()` tự động tạo toàn bộ schema khi thiếu, an toàn cho production.
