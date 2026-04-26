-- Migration 24: Add advanced survey and article features

-- ===== SURVEY ENHANCEMENTS =====

-- Add conditional logic table for show/hide rules
CREATE TABLE IF NOT EXISTS survey_conditional_rules (
    id SERIAL PRIMARY KEY,
    survey_id INTEGER NOT NULL,
    condition_question_id INTEGER NOT NULL,
    condition_value TEXT NOT NULL,
    target_question_id INTEGER NOT NULL,
    action VARCHAR(50) DEFAULT 'show',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    FOREIGN KEY (condition_question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (target_question_id) REFERENCES questions(id) ON DELETE CASCADE,
    UNIQUE(condition_question_id, target_question_id)
);

CREATE INDEX IF NOT EXISTS idx_survey_conditional_rules_survey_id
    ON survey_conditional_rules(survey_id);

-- Add survey settings
DO $$
BEGIN
    ALTER TABLE surveys
    ADD COLUMN IF NOT EXISTS allow_multiple_submissions BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
    ALTER TABLE surveys
    ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMP;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
    ALTER TABLE surveys
    ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
    ALTER TABLE surveys
    ADD COLUMN IF NOT EXISTS collect_email BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Add question enhancements
DO $$
BEGIN
    ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS description TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
    ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS help_text TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
    ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS validation_rules JSONB DEFAULT '{}'::jsonb;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Add partial response support
DO $$
BEGIN
    ALTER TABLE responses
    ADD COLUMN IF NOT EXISTS is_partial BOOLEAN DEFAULT false;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
    ALTER TABLE responses
    ADD COLUMN IF NOT EXISTS last_question_index INTEGER DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- ===== ARTICLE ENHANCEMENTS =====

DO $$
BEGIN
    ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS meta_description VARCHAR(160);
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
    ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS tags TEXT;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
    ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER DEFAULT 1;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Ensure articles have slug (for SEO)
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);

-- ===== AUTOSAVE DRAFTS =====

CREATE TABLE IF NOT EXISTS survey_drafts (
    id SERIAL PRIMARY KEY,
    survey_id INTEGER,
    user_id INTEGER NOT NULL,
    title VARCHAR(255),
    description TEXT,
    questions JSONB DEFAULT '[]'::jsonb,
    survey_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_survey_drafts_user_id
    ON survey_drafts(user_id);

CREATE INDEX IF NOT EXISTS idx_survey_drafts_survey_id
    ON survey_drafts(survey_id);

CREATE TABLE IF NOT EXISTS article_drafts (
    id SERIAL PRIMARY KEY,
    article_id INTEGER,
    user_id INTEGER NOT NULL,
    title VARCHAR(255),
    content TEXT,
    meta_description VARCHAR(160),
    tags TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_article_drafts_user_id
    ON article_drafts(user_id);

CREATE INDEX IF NOT EXISTS idx_article_drafts_article_id
    ON article_drafts(article_id);
