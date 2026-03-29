CREATE TABLE IF NOT EXISTS consulting_events (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES consulting_services(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('view', 'submit')),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consulting_events_service_id
    ON consulting_events (service_id);

CREATE INDEX IF NOT EXISTS idx_consulting_events_event_type
    ON consulting_events (event_type);

CREATE INDEX IF NOT EXISTS idx_consulting_events_created_at
    ON consulting_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_consulting_events_service_event_created
    ON consulting_events (service_id, event_type, created_at DESC);
