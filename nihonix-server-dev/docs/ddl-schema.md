# Database Schema - DDL

## Overview

Database schema cho Nihonix - Ứng dụng học tiếng Nhật.

### Cấu trúc:

```
Level → Topics (25 bài)
  ├── Vocabulary Items (trực tiếp từ topic)
  └── Grammar Sub-topics (optional)
      └── Grammar Patterns
```

### Flow:

- **Vocabulary:** Topic → Vocabulary Items (trực tiếp)
- **Grammar:** Topic → Grammar Sub-topics (optional) → Grammar Patterns

---

## Tables

### 1. `levels` - Cấp độ JLPT

```sql
CREATE TABLE levels (
  code TEXT PRIMARY KEY CHECK (code IN ('N5','N4','N3','N2','N1')),
  name JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Fields:**
- `code`: Mã cấp độ (N5, N4, N3, N2, N1)
- `name`: Tên đa ngôn ngữ `{vi, en, jp}`
- `updated_at`: Thời gian cập nhật

---

### 2. `topics` - 25 bài chính

```sql
CREATE TABLE topics (
  slug TEXT PRIMARY KEY,
  level_code TEXT NOT NULL REFERENCES levels(code) ON UPDATE CASCADE,
  title JSONB NOT NULL,
  icon_svg TEXT,
  "order" INT NOT NULL DEFAULT 1
);
```

**Fields:**
- `slug`: Mã topic (ví dụ: "family", "numbers")
- `level_code`: FK → `levels.code`
- `title`: Tiêu đề đa ngôn ngữ `{vi, en, jp}`
- `icon_svg`: Icon SVG inline
- `order`: Thứ tự hiển thị

**Note:** 25 bài chính trong mỗi level (metadata, không có nội dung học)

---

### 3. `grammar_sub_topics` - Sub-topics cho Grammar (optional)

```sql
CREATE TABLE grammar_sub_topics (
  slug TEXT PRIMARY KEY,
  topic_slug TEXT NOT NULL REFERENCES topics(slug) ON DELETE CASCADE,
  level_code TEXT NOT NULL REFERENCES levels(code) ON UPDATE CASCADE,
  title JSONB NOT NULL,
  "order" INT NOT NULL DEFAULT 1
);
```

**Fields:**
- `slug`: Mã sub-topic (ví dụ: "basic-patterns", "relationships")
- `topic_slug`: FK → `topics.slug`
- `level_code`: FK → `levels.code` (để query nhanh)
- `title`: Tiêu đề đa ngôn ngữ `{vi, en, jp}`
- `order`: Thứ tự hiển thị

**Note:** Chỉ dùng cho Grammar để group patterns. Vocabulary không dùng sub-topics.

---

### 4. `content_items` - Base table cho content

```sql
CREATE TABLE content_items (
  slug TEXT PRIMARY KEY,
  topic_slug TEXT NOT NULL REFERENCES topics(slug) ON UPDATE CASCADE,
  level_code TEXT NOT NULL REFERENCES levels(code) ON UPDATE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('vocabulary', 'grammar', 'exercise')),
  grammar_sub_topic_slug TEXT REFERENCES grammar_sub_topics(slug) ON DELETE SET NULL,
  name JSONB NOT NULL,
  "order" INT NOT NULL DEFAULT 1,
  cover_svg TEXT,
  CONSTRAINT check_grammar_sub_topic CHECK (
    (content_type = 'grammar' AND grammar_sub_topic_slug IS NULL) OR
    (content_type = 'grammar' AND grammar_sub_topic_slug IS NOT NULL) OR
    (content_type != 'grammar' AND grammar_sub_topic_slug IS NULL)
  )
);
```

**Fields:**
- `slug`: Mã content item
- `topic_slug`: FK → `topics.slug`
- `level_code`: FK → `levels.code` (để query nhanh)
- `content_type`: Loại content ('vocabulary', 'grammar', 'exercise')
- `grammar_sub_topic_slug`: FK → `grammar_sub_topics.slug` (nullable, chỉ cho grammar)
- `name`: Tên đa ngôn ngữ `{vi, en, jp}`
- `order`: Thứ tự hiển thị
- `cover_svg`: Cover SVG inline

**Logic:**
- Vocabulary: `grammar_sub_topic_slug` = NULL (trực tiếp từ topic)
- Grammar: `grammar_sub_topic_slug` có thể NULL (trực tiếp) hoặc NOT NULL (qua sub-topic)

**Note:** Base table cho tất cả content items (vocabulary, grammar, etc.)

---

### 5. `vocabulary_items` - Chi tiết vocabulary

```sql
CREATE TABLE vocabulary_items (
  content_item_slug TEXT PRIMARY KEY REFERENCES content_items(slug) ON DELETE CASCADE,
  romaji TEXT NOT NULL,
  kanji TEXT,
  kana TEXT NOT NULL,
  meaning JSONB NOT NULL,
  word_type TEXT NOT NULL CHECK (word_type IN ('noun', 'verb', 'adjective', 'adverb', 'particle')),
  examples JSONB
);
```

**Fields:**
- `content_item_slug`: FK → `content_items.slug`
- `romaji`: Chữ romaji
- `kanji`: Chữ kanji (nullable)
- `kana`: Chữ kana (hiragana/katakana)
- `meaning`: Nghĩa đa ngôn ngữ `{vi, en, jp}`
- `word_type`: Loại từ (noun, verb, adjective, adverb, particle)
- `examples`: Câu ví dụ (JSONB array)

**Note:** Vocabulary items trực tiếp từ topic, KHÔNG qua sub-topics.

---

### 6. `grammar_patterns` - Chi tiết grammar

```sql
CREATE TABLE grammar_patterns (
  content_item_slug TEXT PRIMARY KEY REFERENCES content_items(slug) ON DELETE CASCADE,
  pattern_jp TEXT NOT NULL,
  pattern_romaji TEXT,
  explanation JSONB NOT NULL,
  usage_examples JSONB,
  conjugation_rules JSONB,
  level_difficulty TEXT CHECK (level_difficulty IN ('beginner', 'intermediate', 'advanced')),
  grammar_points JSONB
);
```

**Fields:**
- `content_item_slug`: FK → `content_items.slug`
- `pattern_jp`: Pattern tiếng Nhật
- `pattern_romaji`: Pattern romaji
- `explanation`: Giải thích đa ngôn ngữ `{vi, en, jp}`
- `usage_examples`: Ví dụ sử dụng (JSONB array)
- `conjugation_rules`: Quy tắc chia động từ (JSONB)
- `level_difficulty`: Độ khó (beginner, intermediate, advanced)
- `grammar_points`: Điểm ngữ pháp (JSONB array)

**Note:** Grammar patterns có thể trực tiếp từ topic hoặc qua sub-topics.

---

### 7. `entity_sync` - Bảng sync chung

```sql
CREATE TYPE entity_kind AS ENUM ('level','topic','grammar_sub_topic','content_item');

CREATE TABLE entity_sync (
  entity_kind entity_kind NOT NULL,
  entity_key TEXT NOT NULL,
  row_etag TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  moved_to_key TEXT,
  PRIMARY KEY (entity_kind, entity_key)
);
```

**Fields:**
- `entity_kind`: Loại entity (level, topic, grammar_sub_topic, content_item)
- `entity_key`: Key của entity (slug hoặc code)
- `row_etag`: Version tag để sync
- `updated_at`: Thời gian cập nhật
- `is_deleted`: Đánh dấu đã xóa
- `moved_to_key`: Nếu entity đổi slug/key

**Purpose:** Track version và sync cho tất cả entities

---

## Indexes

```sql
-- Index cho content_items
CREATE INDEX idx_content_items_topic ON content_items(topic_slug, content_type, "order");
CREATE INDEX idx_content_items_level ON content_items(level_code, content_type);
CREATE INDEX idx_content_items_grammar_sub_topic ON content_items(grammar_sub_topic_slug) WHERE grammar_sub_topic_slug IS NOT NULL;

-- Index cho grammar_sub_topics
CREATE INDEX idx_grammar_sub_topics_topic ON grammar_sub_topics(topic_slug, "order");

-- Index cho vocabulary_items
CREATE INDEX idx_vocab_word_type ON vocabulary_items(word_type);

-- Index cho grammar_patterns
CREATE INDEX idx_grammar_difficulty ON grammar_patterns(level_difficulty);
```

---

## Relationships

```
levels (1) ──< (N) topics
topics (1) ──< (N) grammar_sub_topics (optional, chỉ cho grammar)
topics (1) ──< (N) content_items
grammar_sub_topics (1) ──< (N) content_items (nếu content_type = 'grammar')
levels (1) ──< (N) content_items
content_items (1) ──< (1) vocabulary_items (nếu content_type = 'vocabulary')
content_items (1) ──< (1) grammar_patterns (nếu content_type = 'grammar')
```

---

## Complete DDL

```sql
-- Enum
CREATE TYPE entity_kind AS ENUM ('level','topic','grammar_sub_topic','content_item');

-- Levels
CREATE TABLE levels (
  code TEXT PRIMARY KEY CHECK (code IN ('N5','N4','N3','N2','N1')),
  name JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Topics
CREATE TABLE topics (
  slug TEXT PRIMARY KEY,
  level_code TEXT NOT NULL REFERENCES levels(code) ON UPDATE CASCADE,
  title JSONB NOT NULL,
  icon_svg TEXT,
  "order" INT NOT NULL DEFAULT 1
);

-- Grammar Sub-topics (optional)
CREATE TABLE grammar_sub_topics (
  slug TEXT PRIMARY KEY,
  topic_slug TEXT NOT NULL REFERENCES topics(slug) ON DELETE CASCADE,
  level_code TEXT NOT NULL REFERENCES levels(code) ON UPDATE CASCADE,
  title JSONB NOT NULL,
  "order" INT NOT NULL DEFAULT 1
);

-- Content Items (base table)
CREATE TABLE content_items (
  slug TEXT PRIMARY KEY,
  topic_slug TEXT NOT NULL REFERENCES topics(slug) ON UPDATE CASCADE,
  level_code TEXT NOT NULL REFERENCES levels(code) ON UPDATE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('vocabulary', 'grammar', 'exercise')),
  grammar_sub_topic_slug TEXT REFERENCES grammar_sub_topics(slug) ON DELETE SET NULL,
  name JSONB NOT NULL,
  "order" INT NOT NULL DEFAULT 1,
  cover_svg TEXT,
  CONSTRAINT check_grammar_sub_topic CHECK (
    (content_type = 'grammar' AND grammar_sub_topic_slug IS NULL) OR
    (content_type = 'grammar' AND grammar_sub_topic_slug IS NOT NULL) OR
    (content_type != 'grammar' AND grammar_sub_topic_slug IS NULL)
  )
);

-- Vocabulary Items
CREATE TABLE vocabulary_items (
  content_item_slug TEXT PRIMARY KEY REFERENCES content_items(slug) ON DELETE CASCADE,
  romaji TEXT NOT NULL,
  kanji TEXT,
  kana TEXT NOT NULL,
  meaning JSONB NOT NULL,
  word_type TEXT NOT NULL CHECK (word_type IN ('noun', 'verb', 'adjective', 'adverb', 'particle')),
  examples JSONB
);

-- Grammar Patterns
CREATE TABLE grammar_patterns (
  content_item_slug TEXT PRIMARY KEY REFERENCES content_items(slug) ON DELETE CASCADE,
  pattern_jp TEXT NOT NULL,
  pattern_romaji TEXT,
  explanation JSONB NOT NULL,
  usage_examples JSONB,
  conjugation_rules JSONB,
  level_difficulty TEXT CHECK (level_difficulty IN ('beginner', 'intermediate', 'advanced')),
  grammar_points JSONB
);

-- Entity Sync
CREATE TABLE entity_sync (
  entity_kind entity_kind NOT NULL,
  entity_key TEXT NOT NULL,
  row_etag TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  moved_to_key TEXT,
  PRIMARY KEY (entity_kind, entity_key)
);

-- Indexes
CREATE INDEX idx_content_items_topic ON content_items(topic_slug, content_type, "order");
CREATE INDEX idx_content_items_level ON content_items(level_code, content_type);
CREATE INDEX idx_content_items_grammar_sub_topic ON content_items(grammar_sub_topic_slug) WHERE grammar_sub_topic_slug IS NOT NULL;
CREATE INDEX idx_grammar_sub_topics_topic ON grammar_sub_topics(topic_slug, "order");
CREATE INDEX idx_vocab_word_type ON vocabulary_items(word_type);
CREATE INDEX idx_grammar_difficulty ON grammar_patterns(level_difficulty);
```

---

## dbdiagram.io Schema

```dbml
// Nihonix Database Schema for dbdiagram.io
// Paste vào https://dbdiagram.io/d/Nihonix_DB-68f9d39d357668b73239a83a

Table levels {
  code text [primary key]
  name jsonb [not null]
  updated_at timestamptz [default: `now()`, not null]
  
  Note: 'Cấp độ JLPT: N5, N4, N3, N2, N1'
}

Table topics {
  slug text [primary key]
  level_code text [not null]
  title jsonb [not null]
  icon_svg text
  "order" integer [default: 1, not null]
  
  Note: '25 bài chính trong mỗi level (ví dụ: family, numbers, colors)'
}

Table grammar_sub_topics {
  slug text [primary key]
  topic_slug text [not null]
  level_code text [not null]
  title jsonb [not null]
  "order" integer [default: 1, not null]
  
  Note: 'Sub-topics cho Grammar (optional). Vocabulary không dùng sub-topics.'
}

Table content_items {
  slug text [primary key]
  topic_slug text [not null]
  level_code text [not null]
  content_type text [not null]
  grammar_sub_topic_slug text
  name jsonb [not null]
  "order" integer [default: 1, not null]
  cover_svg text
  
  Note: 'Base table cho tất cả content items. grammar_sub_topic_slug chỉ dùng cho grammar (nullable).'
}

Table vocabulary_items {
  content_item_slug text [primary key]
  romaji text [not null]
  kanji text
  kana text [not null]
  meaning jsonb [not null]
  word_type text [not null]
  examples jsonb
  
  Note: 'Chi tiết vocabulary: trực tiếp từ topic (không qua sub-topics)'
}

Table grammar_patterns {
  content_item_slug text [primary key]
  pattern_jp text [not null]
  pattern_romaji text
  explanation jsonb [not null]
  usage_examples jsonb
  conjugation_rules jsonb
  level_difficulty text
  grammar_points jsonb
  
  Note: 'Chi tiết grammar: có thể trực tiếp từ topic hoặc qua sub-topics'
}

Enum entity_kind {
  level
  topic
  grammar_sub_topic
  content_item
}

Table entity_sync {
  entity_kind entity_kind [not null]
  entity_key text [not null]
  row_etag text [not null]
  updated_at timestamptz [not null]
  is_deleted boolean [default: false, not null]
  moved_to_key text
  
  indexes {
    (entity_kind, entity_key) [pk]
  }
  
  Note: 'Bảng sync chung cho tất cả entities'
}

// Relationships
Ref: topics.level_code > levels.code [delete: cascade, update: cascade]
Ref: grammar_sub_topics.topic_slug > topics.slug [delete: cascade, update: cascade]
Ref: grammar_sub_topics.level_code > levels.code [delete: cascade, update: cascade]
Ref: content_items.topic_slug > topics.slug [delete: cascade, update: cascade]
Ref: content_items.level_code > levels.code [delete: cascade, update: cascade]
Ref: content_items.grammar_sub_topic_slug > grammar_sub_topics.slug [delete: set null, update: cascade]
Ref: vocabulary_items.content_item_slug > content_items.slug [delete: cascade, update: cascade]
Ref: grammar_patterns.content_item_slug > content_items.slug [delete: cascade, update: cascade]
```
