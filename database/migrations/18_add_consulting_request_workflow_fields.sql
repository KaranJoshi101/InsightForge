ALTER TABLE consulting_requests
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'new';

ALTER TABLE consulting_requests
    ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE consulting_requests
    ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium';

ALTER TABLE consulting_requests
    ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE consulting_requests
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE consulting_requests
SET status = 'new'
WHERE status IS NULL OR TRIM(status) = '';

UPDATE consulting_requests
SET priority = 'medium'
WHERE priority IS NULL OR TRIM(priority) = '';

ALTER TABLE consulting_requests
    DROP CONSTRAINT IF EXISTS chk_consulting_requests_status;

ALTER TABLE consulting_requests
    ADD CONSTRAINT chk_consulting_requests_status
    CHECK (status IN ('new', 'in_progress', 'waiting_user', 'resolved', 'closed'));

ALTER TABLE consulting_requests
    DROP CONSTRAINT IF EXISTS chk_consulting_requests_priority;

ALTER TABLE consulting_requests
    ADD CONSTRAINT chk_consulting_requests_priority
    CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

CREATE INDEX IF NOT EXISTS idx_consulting_requests_status
    ON consulting_requests (status);

CREATE INDEX IF NOT EXISTS idx_consulting_requests_priority
    ON consulting_requests (priority);

CREATE INDEX IF NOT EXISTS idx_consulting_requests_assigned_to
    ON consulting_requests (assigned_to);
