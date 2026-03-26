-- Add additional question types for filtered free-text inputs
DO $$ BEGIN
  ALTER TYPE question_type ADD VALUE 'text_only';
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TYPE question_type ADD VALUE 'number_only';
EXCEPTION WHEN duplicate_object THEN null;
END $$;
