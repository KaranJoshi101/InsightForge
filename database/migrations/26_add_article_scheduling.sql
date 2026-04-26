-- Migration 26: Add article scheduling support

DO $$
BEGIN
    ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMP;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_articles_scheduled_publish_at
    ON articles(scheduled_publish_at);
