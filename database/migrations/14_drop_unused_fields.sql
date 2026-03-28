-- Migration to drop unused profile fields from users table and remove content from training_notes
ALTER TABLE training_notes DROP COLUMN IF EXISTS content;
