-- Step 7: Replace details with article_id reference

-- Add article_id column to media_posts
DO $$ 
BEGIN
    ALTER TABLE media_posts
    ADD COLUMN article_id INT DEFAULT NULL;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Remove old details column if it exists
DO $$
BEGIN
    ALTER TABLE media_posts
    DROP COLUMN details;
EXCEPTION WHEN undefined_column THEN null;
END $$;

-- Add foreign key constraint for article_id
DO $$
BEGIN
    ALTER TABLE media_posts
    ADD CONSTRAINT fk_media_posts_article_id 
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create index for article lookups
CREATE INDEX IF NOT EXISTS idx_media_posts_article_id ON media_posts(article_id);
