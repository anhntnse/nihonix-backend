-- Migration: Rename flashcard_groups table and group_id column to use "sets" terminology
-- This migration renames the table and column for better UX clarity

-- Step 1: Rename the table
ALTER TABLE flashcard_groups RENAME TO flashcard_sets;

-- Step 2: Rename the column in flashcards table
ALTER TABLE flashcards RENAME COLUMN group_id TO set_id;

-- Step 3: Rename foreign key constraint
-- First, find and drop the old foreign key constraint
ALTER TABLE flashcards DROP CONSTRAINT IF EXISTS FK_flashcards_group_id;

-- Recreate the foreign key constraint with new name
ALTER TABLE flashcards 
ADD CONSTRAINT FK_flashcards_set_id 
FOREIGN KEY (set_id) REFERENCES flashcard_sets(id) ON DELETE CASCADE;

-- Step 4: Rename index on set_id if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'IDX_flashcards_group_id') THEN
        ALTER INDEX IDX_flashcards_group_id RENAME TO IDX_flashcards_set_id;
    END IF;
END
$$;

-- Verification queries (commented out)
-- SELECT * FROM flashcard_sets LIMIT 5;
-- SELECT id, folder_id, set_id FROM flashcards LIMIT 5;
