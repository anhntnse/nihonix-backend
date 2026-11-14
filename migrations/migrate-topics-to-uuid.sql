-- Migration: Add id column to topics table and update foreign keys
-- Step 1: Add id column with default UUID
ALTER TABLE topics ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- Step 2: Fill existing rows with UUIDs (if any don't have id yet)
UPDATE topics SET id = gen_random_uuid() WHERE id IS NULL;

-- Step 3: Make id NOT NULL
ALTER TABLE topics ALTER COLUMN id SET NOT NULL;

-- Step 4: Drop old primary key constraint
ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_pkey;

-- Step 5: Add new primary key on id
ALTER TABLE topics ADD PRIMARY KEY (id);

-- Step 6: Make slug unique (was primary key before)
ALTER TABLE topics ADD CONSTRAINT topics_slug_unique UNIQUE (slug);

-- Step 7: Update vocabulary_items table - add topic_id column
ALTER TABLE vocabulary_items ADD COLUMN IF NOT EXISTS topic_id UUID;

-- Step 8: Migrate data from topic_slug to topic_id
UPDATE vocabulary_items v
SET topic_id = t.id
FROM topics t
WHERE v.topic_slug = t.slug AND v.topic_id IS NULL;

-- Step 9: Drop old foreign key constraint on topic_slug
ALTER TABLE vocabulary_items DROP CONSTRAINT IF EXISTS FK_vocabulary_items_topic_slug;

-- Step 10: Make topic_id NOT NULL (after data migration)
ALTER TABLE vocabulary_items ALTER COLUMN topic_id SET NOT NULL;

-- Step 11: Add new foreign key constraint on topic_id
ALTER TABLE vocabulary_items 
ADD CONSTRAINT FK_vocabulary_items_topic_id 
FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 12: Can optionally drop topic_slug column (but keeping for backward compatibility)
-- ALTER TABLE vocabulary_items DROP COLUMN topic_slug;

-- Step 13: Update grammar_sub_topics table - add topic_id column
ALTER TABLE grammar_sub_topics ADD COLUMN IF NOT EXISTS topic_id UUID;

-- Step 14: Migrate data from topic_slug to topic_id
UPDATE grammar_sub_topics g
SET topic_id = t.id
FROM topics t
WHERE g.topic_slug = t.slug AND g.topic_id IS NULL;

-- Step 15: Drop old foreign key constraint on topic_slug
ALTER TABLE grammar_sub_topics DROP CONSTRAINT IF EXISTS FK_grammar_sub_topics_topic_slug;

-- Step 16: Make topic_id NOT NULL
ALTER TABLE grammar_sub_topics ALTER COLUMN topic_id SET NOT NULL;

-- Step 17: Add new foreign key constraint on topic_id
ALTER TABLE grammar_sub_topics 
ADD CONSTRAINT FK_grammar_sub_topics_topic_id 
FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 18: Can optionally drop topic_slug column
-- ALTER TABLE grammar_sub_topics DROP COLUMN topic_slug;

-- Step 19: Update entity_sync table for topics (change entity_key from slug to id)
UPDATE entity_sync e
SET entity_key = t.id::text
FROM topics t
WHERE e.entity_kind = 'topic' AND e.entity_key = t.slug;

