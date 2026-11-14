-- Migration: Add flashcard_groups table and update flashcards structure
-- Date: 2025-11-12

BEGIN;

-- Step 1: Create flashcard_groups table
CREATE TABLE IF NOT EXISTS flashcard_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug TEXT UNIQUE,
  "order" INT DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT fk_flashcard_groups_folder FOREIGN KEY (folder_id) 
    REFERENCES flashcard_folders(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Step 2: For existing flashcards, create a default group per folder
INSERT INTO flashcard_groups (folder_id, name, slug, "order")
SELECT DISTINCT 
  folder_id,
  'Default Group' AS name,
  CONCAT('default-group-', folder_id) AS slug,
  1 AS "order"
FROM flashcards
WHERE folder_id IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- Step 3: Add group_id column as nullable first
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS group_id UUID;

-- Step 4: Populate group_id with the default group for each folder
UPDATE flashcards f
SET group_id = g.id
FROM flashcard_groups g
WHERE f.folder_id = g.folder_id
  AND g.name = 'Default Group'
  AND f.group_id IS NULL;

-- Step 5: Make group_id NOT NULL and add foreign key
ALTER TABLE flashcards ALTER COLUMN group_id SET NOT NULL;
ALTER TABLE flashcards ADD CONSTRAINT fk_flashcards_group 
  FOREIGN KEY (group_id) REFERENCES flashcard_groups(id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 6: Drop the old name column if it exists
ALTER TABLE flashcards DROP COLUMN IF EXISTS name;

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS idx_flashcard_groups_folder ON flashcard_groups(folder_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_group ON flashcards(group_id);

COMMIT;
