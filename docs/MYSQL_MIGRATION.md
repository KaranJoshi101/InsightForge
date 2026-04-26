# PostgreSQL to MySQL Migration Guide

This project has been switched to MySQL 8 with a compatibility adapter so existing controllers can continue using the same pg-style query interface.

## 1. Environment Variables

Use these variables in .env:

DB_HOST=localhost
DB_PORT=3306
DB_NAME=survey_app
DB_USER=root
DB_PASSWORD=your_password
DB_SSL=false

## 2. Install Dependencies

Install updated server and database dependencies:

- In server package: mysql2
- In database package: mysql2

## 3. Initialize MySQL Schema

Run either of these scripts:

- server init: npm run db:init (from server directory)
- database init: npm run init (from database directory)

Both scripts now:
1. Create the MySQL database if missing
2. Apply schema from database/mysql/schema.sql
3. Normalize legacy seed SQL for MySQL and run seed data

## 4. Data Migration Strategy

Recommended no-loss strategy:

1. Export data from PostgreSQL as CSV per table in FK-safe order.
2. Create schema in MySQL using database/mysql/schema.sql.
3. Import CSV files in parent-first order.
4. Verify row counts and key integrity.

Suggested table import order:

1. users
2. surveys
3. questions
4. options
5. responses
6. answers
7. articles
8. media_posts
9. signup_otp_verifications
10. consulting_services
11. consulting_requests
12. consulting_events
13. platform_events
14. training_categories
15. training_videos
16. training_playlists
17. playlist_items
18. training_notes
19. survey_conditional_rules
20. survey_drafts
21. article_drafts

## 5. Query Compatibility Layer

The runtime adapter in server/config/database.js provides:

- PostgreSQL $1-style placeholder support
- Common cast removal (::int, ::jsonb, etc.)
- ON CONFLICT conversion to MySQL forms
- RETURNING emulation for common INSERT/UPDATE/DELETE patterns
- BEGIN/COMMIT/ROLLBACK support for transaction calls

## 6.1 Verified Edge Cases

The following edge cases were exercised during validation and now behave as expected:

- OTP-gated signup: register returns an OTP initiation response, and login is blocked until verification.
- Consulting analytics overview: a PostgreSQL-specific aggregate query was replaced with MySQL-safe aggregations.
- Seed reruns: init scripts normalize legacy ON CONFLICT and interval syntax rather than failing on reruns.

## 7. Validation Checklist

After migration, validate:

1. Auth: register, login, OTP flow, current-user endpoint
2. Survey CRUD, question/option CRUD, draft autosave
3. Response submission and analytics views
4. Article CRUD, drafts, scheduling/publish flow
5. Media CRUD and linkage behavior
6. Training videos/playlists/items/notes endpoints
7. Consulting services, request flow, analytics endpoints
8. Admin user management and dashboard totals

## 8. Known Risk Areas

The compatibility layer handles common PostgreSQL constructs, but complex SQL patterns may still require endpoint-by-endpoint tuning. Prioritize regression testing on analytics-heavy endpoints and administrative reporting screens. If you restart the API while another process is already bound to port 5000, validate the active instance before testing.
