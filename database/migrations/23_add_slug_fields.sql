-- Step 23: Add SEO slug fields for articles and surveys

DO $$
BEGIN
    ALTER TABLE articles
    ADD COLUMN slug VARCHAR(120);
EXCEPTION WHEN duplicate_column THEN null;
END $$;

DO $$
BEGIN
    ALTER TABLE surveys
    ADD COLUMN slug VARCHAR(120);
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- Backfill article slugs with uniqueness handling.
WITH article_bases AS (
    SELECT
        id,
        COALESCE(NULLIF(regexp_replace(regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g'), ''), 'article') AS base_slug
    FROM articles
), article_ranked AS (
    SELECT
        id,
        base_slug,
        ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY id) AS rn
    FROM article_bases
)
UPDATE articles a
SET slug = CASE
    WHEN ar.rn = 1 THEN ar.base_slug
    ELSE (ar.base_slug || '-' || ar.rn)
END
FROM article_ranked ar
WHERE a.id = ar.id
  AND (a.slug IS NULL OR a.slug = '');

-- Backfill survey slugs with uniqueness handling.
WITH survey_bases AS (
    SELECT
        id,
        COALESCE(NULLIF(regexp_replace(regexp_replace(lower(title), '[^a-z0-9]+', '-', 'g'), '(^-+|-+$)', '', 'g'), ''), 'survey') AS base_slug
    FROM surveys
), survey_ranked AS (
    SELECT
        id,
        base_slug,
        ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY id) AS rn
    FROM survey_bases
)
UPDATE surveys s
SET slug = CASE
    WHEN sr.rn = 1 THEN sr.base_slug
    ELSE (sr.base_slug || '-' || sr.rn)
END
FROM survey_ranked sr
WHERE s.id = sr.id
  AND (s.slug IS NULL OR s.slug = '');

DO $$
BEGIN
    ALTER TABLE articles
    ALTER COLUMN slug SET NOT NULL;
EXCEPTION WHEN undefined_column THEN null;
END $$;

DO $$
BEGIN
    ALTER TABLE surveys
    ALTER COLUMN slug SET NOT NULL;
EXCEPTION WHEN undefined_column THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_slug_unique ON articles(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_surveys_slug_unique ON surveys(slug);
