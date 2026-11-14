// Nihonix Database Schema for dbdiagram.io
// Paste vào https://dbdiagram.io/d/Nihonix_DB-68f9d39d357668b73239a83a
//
// Flow:
// Vocabulary: Topic → Vocabulary Items (trực tiếp)
// Grammar: Topic → Grammar Sub-topic (dạng ngữ pháp) → Grammar Patterns (bài tập)
// Flashcard: Flashcard Folder → Flashcards (front: từ, back: định nghĩa + ví dụ)

// ---- USER & AUTHENTICATION TABLES ----

Table users {
  id integer [primary key, increment]
  username varchar [not null, unique]
  email varchar [not null, unique]
  full_name varchar
  avatar_url varchar
  language varchar [default: 'en']
  status varchar [default: 'active']
  created_at timestamptz [default: `now()`, not null]
  updated_at timestamptz [default: `now()`, not null]
  
  Note: 'Users table. username/email unique case-insensitive ở BE'
}

Table user_auth {
  user_id integer [primary key]
  password_hash varchar [not null]
  token_version integer [default: 0, not null]
  
  Note: 'User authentication. password_hash: argon2id/bcrypt. token_version: logout-all chỉ cần +1'
}

Table verification_tokens {
  id integer [primary key, increment]
  user_id integer [not null]
  type varchar [not null]
  token_hash varchar [not null]
  expires_at timestamptz [not null]
  used_at timestamptz
  created_at timestamptz [default: `now()`, not null]
  
  indexes {
    (user_id, type)
    (expires_at)
    (token_hash)
  }
  
  Note: 'Verification tokens. type: reset_password. token_hash: hash của token (không lưu token thô)'
}

Table sessions {
  id varchar [primary key]
  user_id integer [not null]
  refresh_token_hash varchar [not null]
  user_agent varchar
  ip varchar
  expires_at timestamptz [not null]
  created_at timestamptz [default: `now()`, not null]
  
  indexes {
    (user_id)
    (expires_at)
  }
  
  Note: 'User sessions. id: jti hoặc UUID. refresh_token_hash: LƯU HASH, KHÔNG lưu token thô'
}

// ---- LEARNING CONTENT TABLES ----

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

// Grammar Sub-topics (dạng ngữ pháp)
Table grammar_sub_topics {
  slug text [primary key]
  topic_slug text [not null]
  level_code text [not null]
  title jsonb [not null]
  "order" integer [default: 1, not null]
  
  Note: 'Dạng ngữ pháp trong topic (ví dụ: "Basic Patterns", "Relationships")'
}

// Vocabulary Items - từ vựng trực tiếp từ topic
Table vocabulary_items {
  slug text [primary key]
  topic_slug text [not null]
  level_code text [not null]
  romaji text [not null]
  kanji text
  kana text [not null]
  meaning jsonb [not null]
  word_type text [not null]
  examples jsonb
  "order" integer [default: 1, not null]
  
  Note: 'Từ vựng trực tiếp từ topic (không qua vocabulary lesson)'
}

// Grammar Patterns - bài tập ngữ pháp trong grammar sub-topic
Table grammar_patterns {
  slug text [primary key]
  grammar_sub_topic_slug text [not null]
  topic_slug text [not null]
  level_code text [not null]
  pattern_jp text [not null]
  pattern_romaji text
  explanation jsonb [not null]
  usage_examples jsonb
  conjugation_rules jsonb
  level_difficulty text
  grammar_points jsonb
  "order" integer [default: 1, not null]
  
  Note: 'Bài tập ngữ pháp (pattern) trong dạng ngữ pháp (grammar sub-topic)'
}

Enum entity_kind {
  level
  topic
  grammar_sub_topic
  vocabulary_item
  grammar_pattern
  flashcard_folder
  flashcard
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

// Flashcard Folders - thư mục chứa flashcards
Table flashcard_folders {
  slug text [primary key]
  name jsonb [not null]
  description jsonb
  "order" integer [default: 1, not null]
  created_at timestamptz [default: `now()`, not null]
  updated_at timestamptz [default: `now()`, not null]
  
  Note: 'Thư mục/folder chứa flashcards (ví dụ: "Family Words", "Daily Vocabulary")'
}

// Flashcards - thẻ học từ vựng
Table flashcards {
  slug text [primary key]
  folder_slug text [not null]
  front jsonb [not null]
  back jsonb [not null]
  "order" integer [default: 1, not null]
  created_at timestamptz [default: `now()`, not null]
  updated_at timestamptz [default: `now()`, not null]
  
  Note: 'Flashcard: front = mặt trước (từ), back = mặt sau (định nghĩa + ví dụ)'
}

// ---- RELATIONSHIPS ----

// User & Authentication Relationships
Ref: user_auth.user_id > users.id [delete: cascade]
Ref: verification_tokens.user_id > users.id [delete: cascade]
Ref: sessions.user_id > users.id [delete: cascade]

// Learning Content Relationships
Ref: topics.level_code > levels.code [delete: cascade, update: cascade]
Ref: grammar_sub_topics.topic_slug > topics.slug [delete: cascade, update: cascade]
Ref: grammar_sub_topics.level_code > levels.code [delete: cascade, update: cascade]
Ref: vocabulary_items.topic_slug > topics.slug [delete: cascade, update: cascade]
Ref: vocabulary_items.level_code > levels.code [delete: cascade, update: cascade]
Ref: grammar_patterns.grammar_sub_topic_slug > grammar_sub_topics.slug [delete: cascade, update: cascade]
Ref: grammar_patterns.topic_slug > topics.slug [delete: cascade, update: cascade]
Ref: grammar_patterns.level_code > levels.code [delete: cascade, update: cascade]

// Flashcard Relationships
Ref: flashcards.folder_slug > flashcard_folders.slug [delete: cascade, update: cascade]
