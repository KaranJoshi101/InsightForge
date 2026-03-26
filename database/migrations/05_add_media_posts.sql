-- Step 5: Add Media Posts Table for Social Media Wall

-- Create ENUM types for media posts (if not exists)
DO $$ BEGIN
  CREATE TYPE media_source AS ENUM ('manual', 'linkedin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE media_size AS ENUM ('small', 'medium', 'large');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Media Posts Table
CREATE TABLE IF NOT EXISTS media_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    size media_size DEFAULT 'medium',
    source media_source DEFAULT 'manual',
    external_id VARCHAR(255) UNIQUE, -- For LinkedIn post IDs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_media_posts_created_at ON media_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_posts_source ON media_posts(source);
CREATE INDEX IF NOT EXISTS idx_media_posts_external_id ON media_posts(external_id);
