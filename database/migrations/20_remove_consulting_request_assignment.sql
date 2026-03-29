DROP INDEX IF EXISTS idx_consulting_requests_assigned_to;

ALTER TABLE consulting_requests
    DROP COLUMN IF EXISTS assigned_to;
