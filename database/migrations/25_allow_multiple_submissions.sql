-- Migration 25: Support allow_multiple_submissions behavior

-- Remove the global unique submission constraint so per-survey setting can govern duplicates.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'responses_survey_id_user_id_key'
    ) THEN
        ALTER TABLE responses DROP CONSTRAINT responses_survey_id_user_id_key;
    END IF;
END $$;

-- Keep lookup performance for duplicate checks when allow_multiple_submissions = false.
CREATE INDEX IF NOT EXISTS idx_responses_survey_user_id
    ON responses (survey_id, user_id);
