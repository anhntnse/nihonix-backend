# Data Samples

## Overview

Ví dụ data mẫu cho các bảng trong database.

### Flow:

- **Vocabulary:** Topic → Vocabulary Items (trực tiếp)
- **Grammar:** Topic → Grammar Sub-topics (optional) → Grammar Patterns

---

## 1. Levels (Cấp độ JLPT)

```json
{
  "code": "N5",
  "name": {
    "vi": "Sơ cấp N5",
    "en": "Beginner N5",
    "jp": "初級 N5"
  },
  "updated_at": "2025-01-15T10:00:00Z"
}
```

```json
{
  "code": "N4",
  "name": {
    "vi": "Sơ trung cấp N4",
    "en": "Elementary N4",
    "jp": "初級N4"
  },
  "updated_at": "2025-01-15T10:00:00Z"
}
```

---

## 2. Topics (25 bài chính)

### Topic 1: Family

```json
{
  "slug": "family",
  "level_code": "N5",
  "title": {
    "vi": "Gia đình",
    "en": "Family",
    "jp": "家族"
  },
  "icon_svg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z'/></svg>",
  "order": 1
}
```

### Topic 2: Numbers

```json
{
  "slug": "numbers",
  "level_code": "N5",
  "title": {
    "vi": "Số đếm",
    "en": "Numbers & Counting",
    "jp": "数字"
  },
  "icon_svg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M7 9h2v10H7zm4 0h2v10h-2zm4 0h2v10h-2z'/></svg>",
  "order": 2
}
```

### Topic 3: Colors

```json
{
  "slug": "colors",
  "level_code": "N5",
  "title": {
    "vi": "Màu sắc",
    "en": "Colors",
    "jp": "色"
  },
  "icon_svg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><circle cx='12' cy='12' r='10' fill='none' stroke='currentColor' stroke-width='2'/></svg>",
  "order": 3
}
```

---

## 3. Grammar Sub-topics (optional - chỉ cho Grammar)

### Sub-topic 1: Basic Patterns

```json
{
  "slug": "basic-patterns",
  "topic_slug": "family",
  "level_code": "N5",
  "title": {
    "vi": "Cấu trúc cơ bản",
    "en": "Basic Patterns",
    "jp": "基本的な構造"
  },
  "order": 1
}
```

### Sub-topic 2: Relationships

```json
{
  "slug": "relationships",
  "topic_slug": "family",
  "level_code": "N5",
  "title": {
    "vi": "Quan hệ",
    "en": "Relationships",
    "jp": "関係"
  },
  "order": 2
}
```

**Note:** Grammar sub-topics là optional. Grammar patterns có thể trực tiếp từ topic nếu không cần group.

---

## 4. Content Items - Vocabulary

### Vocabulary Item 1: 家族 (Family)

**content_items:**
```json
{
  "slug": "vocab-kazoku",
  "topic_slug": "family",
  "level_code": "N5",
  "content_type": "vocabulary",
  "name": {
    "vi": "Gia đình",
    "en": "Family",
    "jp": "家族"
  },
  "order": 1,
  "cover_svg": null
}
```

**vocabulary_items:**
```json
{
  "content_item_slug": "vocab-kazoku",
  "romaji": "kazoku",
  "kanji": "家族",
  "kana": "かぞく",
  "meaning": {
    "vi": "gia đình",
    "en": "family",
    "jp": "家族"
  },
  "word_type": "noun",
  "examples": [
    {
      "sentence_jp": "私の家族は三人です。",
      "sentence_romaji": "Watashi no kazoku wa sannin desu.",
      "sentence_vi": "Gia đình tôi có ba người.",
      "sentence_en": "My family has three people."
    },
    {
      "sentence_jp": "家族と旅行に行きました。",
      "sentence_romaji": "Kazoku to ryokou ni ikimashita.",
      "sentence_vi": "Tôi đã đi du lịch với gia đình.",
      "sentence_en": "I went on a trip with my family."
    }
  ]
}
```

### Vocabulary Item 2: 父 (Father)

**content_items:**
```json
{
  "slug": "vocab-chichi",
  "topic_slug": "family",
  "level_code": "N5",
  "content_type": "vocabulary",
  "name": {
    "vi": "Cha/Bố",
    "en": "Father",
    "jp": "父"
  },
  "order": 2,
  "cover_svg": null
}
```

**vocabulary_items:**
```json
{
  "content_item_slug": "vocab-chichi",
  "romaji": "chichi",
  "kanji": "父",
  "kana": "ちち",
  "meaning": {
    "vi": "cha, bố",
    "en": "father, dad",
    "jp": "父"
  },
  "word_type": "noun",
  "examples": [
    {
      "sentence_jp": "父は医者です。",
      "sentence_romaji": "Chichi wa isha desu.",
      "sentence_vi": "Bố tôi là bác sĩ.",
      "sentence_en": "My father is a doctor."
    }
  ]
}
```

### Vocabulary Item 3: 母 (Mother)

**content_items:**
```json
{
  "slug": "vocab-haha",
  "topic_slug": "family",
  "level_code": "N5",
  "content_type": "vocabulary",
  "name": {
    "vi": "Mẹ",
    "en": "Mother",
    "jp": "母"
  },
  "order": 3,
  "cover_svg": null
}
```

**vocabulary_items:**
```json
{
  "content_item_slug": "vocab-haha",
  "romaji": "haha",
  "kanji": "母",
  "kana": "はは",
  "meaning": {
    "vi": "mẹ",
    "en": "mother, mom",
    "jp": "母"
  },
  "word_type": "noun",
  "examples": [
    {
      "sentence_jp": "母は料理が好きです。",
      "sentence_romaji": "Haha wa ryouri ga suki desu.",
      "sentence_vi": "Mẹ tôi thích nấu ăn.",
      "sentence_en": "My mother likes cooking."
    }
  ]
}
```

---

## 5. Content Items - Grammar

### Grammar Pattern 1: 〜は〜です (trực tiếp từ topic)

**content_items:**
```json
{
  "slug": "grammar-wa-desu",
  "topic_slug": "family",
  "level_code": "N5",
  "content_type": "grammar",
  "grammar_sub_topic_slug": null,
  "name": {
    "vi": "〜は〜です",
    "en": "〜は〜です",
    "jp": "〜は〜です"
  },
  "order": 1,
  "cover_svg": null
}
```

**grammar_patterns:**
```json
{
  "content_item_slug": "grammar-wa-desu",
  "pattern_jp": "〜は〜です",
  "pattern_romaji": "〜wa〜desu",
  "explanation": {
    "vi": "Cấu trúc cơ bản để giới thiệu hoặc mô tả. 'は' là chủ ngữ, 'です' là động từ 'là'.",
    "en": "Basic structure for introduction or description. 'は' is the topic marker, 'です' means 'to be'.",
    "jp": "基本的な紹介や説明の構造。'は'は主題、'です'は'である'という意味。"
  },
  "usage_examples": [
    {
      "sentence_jp": "私は学生です。",
      "sentence_romaji": "Watashi wa gakusei desu.",
      "sentence_vi": "Tôi là học sinh.",
      "sentence_en": "I am a student."
    },
    {
      "sentence_jp": "これは本です。",
      "sentence_romaji": "Kore wa hon desu.",
      "sentence_vi": "Đây là quyển sách.",
      "sentence_en": "This is a book."
    }
  ],
  "conjugation_rules": {
    "affirmative": "〜です",
    "negative": "〜ではありません",
    "past": "〜でした",
    "past_negative": "〜ではありませんでした"
  },
  "level_difficulty": "beginner",
  "grammar_points": ["topic_marker", "copula", "introduction"]
}
```

### Grammar Pattern 2: 〜が好きです (qua sub-topic "basic-patterns")

**content_items:**
```json
{
  "slug": "grammar-wa-desu",
  "topic_slug": "family",
  "level_code": "N5",
  "content_type": "grammar",
  "name": {
    "vi": "〜は〜です",
    "en": "〜は〜です",
    "jp": "〜は〜です"
  },
  "order": 1,
  "cover_svg": null
}
```

**grammar_patterns:**
```json
{
  "content_item_slug": "grammar-wa-desu",
  "pattern_jp": "〜は〜です",
  "pattern_romaji": "〜wa〜desu",
  "explanation": {
    "vi": "Cấu trúc cơ bản để giới thiệu hoặc mô tả. 'は' là chủ ngữ, 'です' là động từ 'là'.",
    "en": "Basic structure for introduction or description. 'は' is the topic marker, 'です' means 'to be'.",
    "jp": "基本的な紹介や説明の構造。'は'は主題、'です'は'である'という意味。"
  },
  "usage_examples": [
    {
      "sentence_jp": "私は学生です。",
      "sentence_romaji": "Watashi wa gakusei desu.",
      "sentence_vi": "Tôi là học sinh.",
      "sentence_en": "I am a student."
    },
    {
      "sentence_jp": "これは本です。",
      "sentence_romaji": "Kore wa hon desu.",
      "sentence_vi": "Đây là quyển sách.",
      "sentence_en": "This is a book."
    }
  ],
  "conjugation_rules": {
    "affirmative": "〜です",
    "negative": "〜ではありません",
    "past": "〜でした",
    "past_negative": "〜ではありませんでした"
  },
  "level_difficulty": "beginner",
  "grammar_points": ["topic_marker", "copula", "introduction"]
}
```

**content_items:**
```json
{
  "slug": "grammar-ga-suki",
  "topic_slug": "family",
  "level_code": "N5",
  "content_type": "grammar",
  "grammar_sub_topic_slug": "basic-patterns",
  "name": {
    "vi": "〜が好きです",
    "en": "〜が好きです",
    "jp": "〜が好きです"
  },
  "order": 1,
  "cover_svg": null
}
```

**grammar_patterns:**
```json
{
  "content_item_slug": "grammar-ga-suki",
  "pattern_jp": "〜が好きです",
  "pattern_romaji": "〜ga suki desu",
  "explanation": {
    "vi": "Cấu trúc để diễn đạt sở thích. 'が' là trợ từ, '好き' nghĩa là 'thích'.",
    "en": "Structure to express likes. 'が' is a particle, '好き' means 'to like'.",
    "jp": "好みを表現する構造。'が'は助詞、'好き'は'好きだ'という意味。"
  },
  "usage_examples": [
    {
      "sentence_jp": "私は本が好きです。",
      "sentence_romaji": "Watashi wa hon ga suki desu.",
      "sentence_vi": "Tôi thích sách.",
      "sentence_en": "I like books."
    },
    {
      "sentence_jp": "母は料理が好きです。",
      "sentence_romaji": "Haha wa ryouri ga suki desu.",
      "sentence_vi": "Mẹ tôi thích nấu ăn.",
      "sentence_en": "My mother likes cooking."
    }
  ],
  "conjugation_rules": {
    "affirmative": "〜が好きです",
    "negative": "〜が好きではありません",
    "past": "〜が好きでした",
    "past_negative": "〜が好きではありませんでした"
  },
  "level_difficulty": "beginner",
  "grammar_points": ["particle_ga", "likes_dislikes", "adjectives"]
}
```

---

## 6. Entity Sync Examples

### Sync cho Level N5:

```json
{
  "entity_kind": "level",
  "entity_key": "N5",
  "row_etag": "lv-N5-r1",
  "updated_at": "2025-01-15T10:00:00Z",
  "is_deleted": false,
  "moved_to_key": null
}
```

### Sync cho Topic "family":

```json
{
  "entity_kind": "topic",
  "entity_key": "family",
  "row_etag": "tp-family-r2",
  "updated_at": "2025-01-20T14:30:00Z",
  "is_deleted": false,
  "moved_to_key": null
}
```

### Sync cho Content Item "vocab-kazoku":

```json
{
  "entity_kind": "content_item",
  "entity_key": "vocab-kazoku",
  "row_etag": "ci-vocab-kazoku-r3",
  "updated_at": "2025-01-22T09:20:00Z",
  "is_deleted": false,
  "moved_to_key": null
}
```

### Sync cho Content Item đã bị xóa:

```json
{
  "entity_kind": "content_item",
  "entity_key": "old-vocab-slug",
  "row_etag": "ci-old-vocab-slug-r5",
  "updated_at": "2025-01-25T15:00:00Z",
  "is_deleted": true,
  "moved_to_key": null
}
```

### Sync cho Grammar Sub-topic "basic-patterns":

```json
{
  "entity_kind": "grammar_sub_topic",
  "entity_key": "basic-patterns",
  "row_etag": "gst-basic-patterns-r1",
  "updated_at": "2025-01-23T10:00:00Z",
  "is_deleted": false,
  "moved_to_key": null
}
```

### Sync cho Content Item đã đổi slug:

```json
{
  "entity_kind": "content_item",
  "entity_key": "old-grammar-slug",
  "row_etag": "ci-old-grammar-slug-r4",
  "updated_at": "2025-01-24T11:00:00Z",
  "is_deleted": false,
  "moved_to_key": "new-grammar-slug"
}
```

---

## 7. Query Examples

### Get all vocabulary in topic "family" (trực tiếp):

```sql
SELECT 
  ci.slug,
  ci.name,
  vi.romaji,
  vi.kanji,
  vi.kana,
  vi.meaning,
  vi.word_type,
  vi.examples
FROM content_items ci
INNER JOIN vocabulary_items vi ON ci.slug = vi.content_item_slug
WHERE ci.topic_slug = 'family'
  AND ci.content_type = 'vocabulary'
ORDER BY ci."order";
```

### Get all grammar patterns in topic "family" (trực tiếp, không qua sub-topics):

```sql
SELECT 
  ci.slug,
  ci.name,
  gp.pattern_jp,
  gp.pattern_romaji,
  gp.explanation,
  gp.usage_examples,
  gp.conjugation_rules
FROM content_items ci
INNER JOIN grammar_patterns gp ON ci.slug = gp.content_item_slug
WHERE ci.topic_slug = 'family'
  AND ci.content_type = 'grammar'
  AND ci.grammar_sub_topic_slug IS NULL
ORDER BY ci."order";
```

### Get all grammar patterns via sub-topics:

```sql
SELECT 
  gst.slug as sub_topic_slug,
  gst.title as sub_topic_title,
  ci.slug,
  ci.name,
  gp.pattern_jp,
  gp.pattern_romaji,
  gp.explanation
FROM grammar_sub_topics gst
INNER JOIN content_items ci ON gst.slug = ci.grammar_sub_topic_slug
INNER JOIN grammar_patterns gp ON ci.slug = gp.content_item_slug
WHERE gst.topic_slug = 'family'
ORDER BY gst."order", ci."order";
```

### Get all grammar sub-topics in topic "family":

```sql
SELECT 
  gst.slug,
  gst.title,
  gst."order"
FROM grammar_sub_topics gst
WHERE gst.topic_slug = 'family'
ORDER BY gst."order";
```

### Get all content items in topic "family":

```sql
SELECT 
  ci.slug,
  ci.content_type,
  ci.name,
  ci."order",
  CASE 
    WHEN ci.content_type = 'vocabulary' THEN vi.romaji
    WHEN ci.content_type = 'grammar' THEN gp.pattern_jp
    ELSE NULL
  END as main_content
FROM content_items ci
LEFT JOIN vocabulary_items vi 
  ON ci.slug = vi.content_item_slug AND ci.content_type = 'vocabulary'
LEFT JOIN grammar_patterns gp 
  ON ci.slug = gp.content_item_slug AND ci.content_type = 'grammar'
WHERE ci.topic_slug = 'family'
ORDER BY ci."order";
```

### Get vocabulary by word_type:

```sql
SELECT 
  ci.slug,
  ci.name,
  vi.*
FROM content_items ci
INNER JOIN vocabulary_items vi ON ci.slug = vi.content_item_slug
WHERE ci.level_code = 'N5'
  AND ci.content_type = 'vocabulary'
  AND vi.word_type = 'noun'
ORDER BY ci."order";
```

---

```sql
SELECT 
  gst.slug,
  gst.title,
  gst."order"
FROM grammar_sub_topics gst
WHERE gst.topic_slug = 'family'
ORDER BY gst."order";
```

---

## 8. API Response Examples

### GET /api/topics?level_code=N5

```json
[
  {
    "slug": "family",
    "level_code": "N5",
    "title": {
      "vi": "Gia đình",
      "en": "Family",
      "jp": "家族"
    },
    "icon_svg": "<svg>...</svg>",
    "order": 1,
    "_sync": {
      "slug": "family",
      "row_etag": "tp-family-r2",
      "updated_at": "2025-01-20T14:30:00Z",
      "is_deleted": false,
      "moved_to_slug": null
    }
  }
]
```

### GET /api/content-items?topic_slug=family&content_type=vocabulary

```json
[
  {
    "slug": "vocab-kazoku",
    "topic_slug": "family",
    "level_code": "N5",
    "content_type": "vocabulary",
    "name": {
      "vi": "Gia đình",
      "en": "Family",
      "jp": "家族"
    },
    "order": 1,
    "cover_svg": null,
    "vocabulary": {
      "romaji": "kazoku",
      "kanji": "家族",
      "kana": "かぞく",
      "meaning": {
        "vi": "gia đình",
        "en": "family",
        "jp": "家族"
      },
      "word_type": "noun",
      "examples": [...]
    },
    "_sync": {
      "slug": "vocab-kazoku",
      "row_etag": "ci-vocab-kazoku-r3",
      "updated_at": "2025-01-22T09:20:00Z",
      "is_deleted": false,
      "moved_to_slug": null
    }
  }
]
```

### GET /api/grammar-sub-topics?topic_slug=family

```json
[
  {
    "slug": "basic-patterns",
    "topic_slug": "family",
    "level_code": "N5",
    "title": {
      "vi": "Cấu trúc cơ bản",
      "en": "Basic Patterns",
      "jp": "基本的な構造"
    },
    "order": 1,
    "_sync": {
      "slug": "basic-patterns",
      "row_etag": "gst-basic-patterns-r1",
      "updated_at": "2025-01-23T10:00:00Z",
      "is_deleted": false,
      "moved_to_slug": null
    }
  }
]
```

### GET /api/content-items?topic_slug=family&content_type=grammar

```json
[
  {
    "slug": "grammar-wa-desu",
    "topic_slug": "family",
    "level_code": "N5",
    "content_type": "grammar",
    "name": {
      "vi": "〜は〜です",
      "en": "〜は〜です",
      "jp": "〜は〜です"
    },
    "order": 1,
    "cover_svg": null,
    "grammar": {
      "pattern_jp": "〜は〜です",
      "pattern_romaji": "〜wa〜desu",
      "explanation": {
        "vi": "Cấu trúc cơ bản để giới thiệu hoặc mô tả...",
        "en": "Basic structure for introduction or description...",
        "jp": "基本的な紹介や説明の構造..."
      },
      "usage_examples": [...],
      "conjugation_rules": {...},
      "level_difficulty": "beginner",
      "grammar_points": ["topic_marker", "copula", "introduction"]
    },
    "_sync": {
      "slug": "grammar-wa-desu",
      "row_etag": "ci-grammar-wa-desu-r1",
      "updated_at": "2025-01-22T10:00:00Z",
      "is_deleted": false,
      "moved_to_slug": null
    }
  }
]
```

