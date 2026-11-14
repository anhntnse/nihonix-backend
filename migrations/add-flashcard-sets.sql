-- Migration: Add flashcard_sets table and update flashcards structure
-- Date: 2025-11-12

BEGIN;

-- Step 1: Create flashcard_sets table
CREATE TABLE IF NOT EXISTS flashcard_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug TEXT UNIQUE,
  "order" INT DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT fk_flashcard_sets_folder FOREIGN KEY (folder_id) 
    REFERENCES flashcard_folders(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Step 2: For existing flashcards, create a default set per folder
INSERT INTO flashcard_sets (folder_id, name, slug, "order")
SELECT DISTINCT 
  folder_id,
  'Default Set' AS name,
  CONCAT('default-set-', folder_id) AS slug,
  1 AS "order"
FROM flashcards
WHERE folder_id IS NOT NULL
ON CONFLICT (slug) DO NOTHING;

-- Step 3: Add set_id column as nullable first
ALTER TABLE flashcards ADD COLUMN IF NOT EXISTS set_id UUID;

-- Step 4: Populate set_id with the default set for each folder
UPDATE flashcards f
SET set_id = s.id
FROM flashcard_sets s
WHERE f.folder_id = s.folder_id
  AND s.name = 'Default Set'
  AND f.set_id IS NULL;

-- Step 5: Make set_id NOT NULL and add foreign key
ALTER TABLE flashcards ALTER COLUMN set_id SET NOT NULL;
ALTER TABLE flashcards ADD CONSTRAINT fk_flashcards_set 
  FOREIGN KEY (set_id) REFERENCES flashcard_sets(id) 
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 6: Drop the old name column if it exists
ALTER TABLE flashcards DROP COLUMN IF EXISTS name;

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS idx_flashcard_sets_folder ON flashcard_sets(folder_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_set ON flashcards(set_id);

COMMIT;
