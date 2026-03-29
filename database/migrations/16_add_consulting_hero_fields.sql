ALTER TABLE consulting_services
    ADD COLUMN IF NOT EXISTS hero_subtitle TEXT;

ALTER TABLE consulting_services
    ADD COLUMN IF NOT EXISTS hero_benefits JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE consulting_services
SET hero_subtitle = COALESCE(NULLIF(TRIM(hero_subtitle), ''), short_description)
WHERE hero_subtitle IS NULL OR TRIM(hero_subtitle) = '';
