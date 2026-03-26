-- Create training playlists and playlist items tables

CREATE TABLE IF NOT EXISTS training_playlists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS playlist_items (
    id SERIAL PRIMARY KEY,
    playlist_id INTEGER NOT NULL,
    video_id INTEGER NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES training_playlists(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES training_videos(id) ON DELETE CASCADE,
    UNIQUE(playlist_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_playlists_active_order
    ON training_playlists (is_active, display_order, id);

CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist
    ON playlist_items (playlist_id, order_index);

-- Insert sample playlists
INSERT INTO training_playlists (name, description, display_order, is_active)
VALUES
    ('SaaS Tutorial Series', 'Comprehensive guide to Software as a Service concepts', 1, true),
    ('R Programming Fundamentals', 'Learn R programming from basics to advanced techniques', 2, true),
    ('Survey Design & Analysis', 'Complete training on survey methodology', 3, true)
ON CONFLICT DO NOTHING;
