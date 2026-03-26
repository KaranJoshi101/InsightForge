CREATE TABLE IF NOT EXISTS training_videos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    youtube_id VARCHAR(32) NOT NULL UNIQUE,
    duration_minutes INTEGER,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_training_videos_active_order
    ON training_videos (is_active, display_order, id);

CREATE INDEX IF NOT EXISTS idx_training_videos_created_at
    ON training_videos (created_at DESC);

INSERT INTO training_videos (title, description, youtube_id, duration_minutes, display_order, is_active)
VALUES
    ('Survey Design Fundamentals', 'Learn how to design reliable and research-ready surveys from the ground up.', 'R7vmHGAshi8', 16, 1, true),
    ('How to Analyze Survey Data', 'A practical walkthrough of common methods for quantitative survey analysis.', '8MBCYXWlvqk', 21, 2, true),
    ('Avoiding Bias in Questionnaires', 'Understand response bias, wording effects, and how to improve question quality.', 'Ytt6WZf0Wn8', 14, 3, true)
ON CONFLICT (youtube_id) DO NOTHING;
