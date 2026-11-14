-- Check current structure and migrate if needed

-- Check if topics already has id column
DO $$ 
BEGIN
    -- If id column doesn't exist, run full migration
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'topics' AND column_name = 'id'
    ) THEN
        -- Add id column
        ALTER TABLE topics ADD COLUMN id UUID DEFAULT gen_random_uuid();
        UPDATE topics SET id = gen_random_uuid() WHERE id IS NULL;
        ALTER TABLE topics ALTER COLUMN id SET NOT NULL;
        
        -- Change primary key
        ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_pkey;
        ALTER TABLE topics ADD PRIMARY KEY (id);
        ALTER TABLE topics ADD CONSTRAINT topics_slug_unique UNIQUE (slug);
        
        RAISE NOTICE 'Topics table migrated to UUID primary key';
    ELSE
        RAISE NOTICE 'Topics table already has id column';
    END IF;
END $$;

-- Migrate vocabulary_items
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'vocabulary_items' AND column_name = 'topic_id'
    ) THEN
        ALTER TABLE vocabulary_items ADD COLUMN topic_id UUID;
        
        UPDATE vocabulary_items v
        SET topic_id = t.id
        FROM topics t
        WHERE v.topic_slug = t.slug;
        
        ALTER TABLE vocabulary_items DROP CONSTRAINT IF EXISTS FK_vocabulary_items_topic_slug;
        ALTER TABLE vocabulary_items ALTER COLUMN topic_id SET NOT NULL;
        
        ALTER TABLE vocabulary_items 
        ADD CONSTRAINT FK_vocabulary_items_topic_id 
        FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE 'vocabulary_items migrated to use topic_id';
    ELSE
        -- Update existing topic_id if NULL
        UPDATE vocabulary_items v
        SET topic_id = t.id
        FROM topics t
        WHERE v.topic_slug = t.slug AND v.topic_id IS NULL;
        
        RAISE NOTICE 'vocabulary_items already has topic_id column';
    END IF;
END $$;

-- Migrate grammar_sub_topics
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'grammar_sub_topics' AND column_name = 'topic_id'
    ) THEN
        ALTER TABLE grammar_sub_topics ADD COLUMN topic_id UUID;
        
        UPDATE grammar_sub_topics g
        SET topic_id = t.id
        FROM topics t
        WHERE g.topic_slug = t.slug;
        
        ALTER TABLE grammar_sub_topics DROP CONSTRAINT IF EXISTS FK_grammar_sub_topics_topic_slug;
        ALTER TABLE grammar_sub_topics ALTER COLUMN topic_id SET NOT NULL;
        
        ALTER TABLE grammar_sub_topics 
        ADD CONSTRAINT FK_grammar_sub_topics_topic_id 
        FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE ON UPDATE CASCADE;
        
        RAISE NOTICE 'grammar_sub_topics migrated to use topic_id';
    ELSE
        -- Update existing topic_id if NULL
        UPDATE grammar_sub_topics g
        SET topic_id = t.id
        FROM topics t
        WHERE g.topic_slug = t.slug AND g.topic_id IS NULL;
        
        RAISE NOTICE 'grammar_sub_topics already has topic_id column';
    END IF;
END $$;

-- Update entity_sync
UPDATE entity_sync e
SET entity_key = t.id::text
FROM topics t
WHERE e.entity_kind = 'topic' AND e.entity_key = t.slug
  AND EXISTS (SELECT 1 FROM topics WHERE slug = e.entity_key);

SELECT 'Migration completed!' as status;

