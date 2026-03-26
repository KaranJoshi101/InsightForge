-- Add configurable submission email template fields to surveys

ALTER TABLE surveys
ADD COLUMN IF NOT EXISTS submission_email_subject VARCHAR(255),
ADD COLUMN IF NOT EXISTS submission_email_body TEXT,
ADD COLUMN IF NOT EXISTS submission_email_attachments JSONB NOT NULL DEFAULT '[]'::jsonb;
