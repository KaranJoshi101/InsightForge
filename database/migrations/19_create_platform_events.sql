CREATE TABLE IF NOT EXISTS platform_events (
    id SERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_platform_events_event_type
        CHECK (event_type IN ('page_view', 'survey_submit', 'consulting_view', 'consulting_request', 'article_view', 'media_view', 'training_view')),
    CONSTRAINT chk_platform_events_entity_type
        CHECK (entity_type IN ('survey', 'article', 'media', 'training', 'consulting', 'platform'))
);

CREATE INDEX IF NOT EXISTS idx_platform_events_event_type
    ON platform_events (event_type);

CREATE INDEX IF NOT EXISTS idx_platform_events_entity_type
    ON platform_events (entity_type);

CREATE INDEX IF NOT EXISTS idx_platform_events_entity_id
    ON platform_events (entity_id);

CREATE INDEX IF NOT EXISTS idx_platform_events_created_at
    ON platform_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_events_session_id
    ON platform_events (session_id);

CREATE INDEX IF NOT EXISTS idx_platform_events_entity_event_created
    ON platform_events (entity_type, event_type, created_at DESC);
