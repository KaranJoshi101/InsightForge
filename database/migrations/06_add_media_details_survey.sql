-- Step 6: Add Details and Survey Support to Media Posts

-- Add columns to media_posts table
DO $$ 
BEGIN
    ALTER TABLE media_posts
    ADD COLUMN details TEXT DEFAULT NULL;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$ 
BEGIN
    ALTER TABLE media_posts
    ADD COLUMN survey_id INT DEFAULT NULL;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Add foreign key constraint for survey_id
DO $$
BEGIN
    ALTER TABLE media_posts
    ADD CONSTRAINT fk_media_posts_survey_id 
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create index for survey lookups
CREATE INDEX IF NOT EXISTS idx_media_posts_survey_id ON media_posts(survey_id);
