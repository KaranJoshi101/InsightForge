-- Add training categories and category notes (documents)

CREATE TABLE IF NOT EXISTS training_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE training_playlists
    ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES training_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_training_playlists_category
    ON training_playlists (category_id, is_active, display_order, id);

CREATE TABLE IF NOT EXISTS training_notes (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES training_categories(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    document_url VARCHAR(1000),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_training_notes_category
    ON training_notes (category_id, is_active, display_order, id);
