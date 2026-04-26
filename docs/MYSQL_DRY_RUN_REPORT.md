# MySQL Migration Dry-Run Report

Date: 2026-04-26
Environment: local Windows, API on http://localhost:5000, MySQL on localhost:3306

## 1) Public Endpoint Regression

Validated public endpoints returned 200 with expected payload shapes:

- /api/health
- /api/health/db
- /api/surveys?page=1&limit=5
- /api/articles?page=1&limit=5
- /api/media?page=1&limit=5
- /api/training/categories
- /api/consulting

Notes:
- /api/analytics/overview returns 401 when unauthenticated (expected protected-route behavior).

## 2) Auth Flow Regression

Observed behavior:
- Register endpoint succeeds and returns OTP initiation payload.
- Immediate login for the new account returns 401 until OTP verification.

Interpretation:
- This is consistent with OTP-gated signup flow and not a MySQL SQL-compatibility failure.

## 3) Schema Presence and Row Count Snapshot

Dry-run query report summary:

- Database: survey_app
- Host/Port: localhost:3306
- Foreign keys discovered: 28
- Core migration tables checked: 21/21 present

Row counts snapshot:

- users: 0
- surveys: 0
- questions: 0
- options: 0
- responses: 0
- answers: 0
- articles: 0
- media_posts: 0
- signup_otp_verifications: 1
- consulting_services: 0
- consulting_requests: 0
- consulting_events: 0
- platform_events: 0
- training_categories: 0
- training_videos: 0
- training_playlists: 0
- playlist_items: 0
- training_notes: 0
- survey_conditional_rules: 0
- survey_drafts: 0
- article_drafts: 0

## 4) Seed Compatibility Check

Legacy PostgreSQL seed syntax still exists in the checked-in seed files, but the init path now normalizes it before execution.

Observed behavior:

- database/init.js completes schema application and seed insertion successfully
- server/init.js completes schema application and seed insertion successfully
- seed_media_posts.sql is also normalized during bootstrap

Impact:
- The repository can keep the existing seed sources for reference while MySQL bootstrap remains green.

## 5) Current Risk Status

- Runtime API boot and key public modules: PASS
- Protected-route deep regression (admin/business flows): PASS after refreshed-server revalidation
- Seed portability: PASS at runtime via bootstrap normalization, even though the checked-in seed files still retain legacy Postgres syntax

## 6) Suggested Next Validation

1. Keep the sign-off docs in sync if any additional endpoints or tables are added.
2. Re-run the regression matrix after future seed or schema changes.
