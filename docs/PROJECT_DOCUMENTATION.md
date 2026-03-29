# Survey App - Complete Project Documentation

Version: 1.1
Last Updated: 2026-03-29 (Admin docs + consulting analytics period updates)

## 1. Project Overview

Survey App is a full-stack PERN platform for creating surveys, collecting responses, publishing articles/media/training content, and managing users through an admin dashboard.

### Primary Goals
- Support secure registration/login with role-based access.
- Allow admins to build and publish surveys.
- Allow users to submit one response per survey and review their submissions.
- Provide response analytics and export-ready reporting data.
- Support content workflows for articles, media feed, and training resources.
- Support consulting services pages with lead capture requests.

### Core Stack
- Frontend: React (CRA + CRACO), React Router, Axios, Chart.js
- Backend: Node.js, Express, PostgreSQL
- Auth/Security: JWT, bcryptjs, helmet, CORS policy, rate limiting
- Uploads: Multer + static serving from backend uploads directory

## 2. Repository Structure

```text
survey-app/
  client/                  React frontend
  server/                  Express API
  database/                DB scripts/migrations/seeds
  docs/                    Documentation
  scripts/                 Utility scripts (for example smoke tests)
  logs/                    Runtime logs
  ecosystem.config.js      PM2 config
```

## 3. Runtime Architecture

### Ports and URL Defaults
- Frontend: 3000
- Backend API: 5000
- API base path: /api
- Health: /api/health
- DB health: /api/health/db

### Backend Route Mounts
- /api/auth
- /api/surveys
- /api/responses
- /api/articles
- /api/users
- /api/media
- /api/training
- /api/consulting
- /uploads (static files, runtime uploads)

### Security and Middleware (server)
- `helmet`-based security headers via middleware wrapper.
- Global rate limiter and auth-specific limiter settings.
- CORS configuration from environment values.
- JSON body size stricter in production.
- Optional proxy trust controlled by TRUST_PROXY.
- Production bootstrap validation for JWT secret and CORS origin config.

## 4. Frontend Application Surface

### Main User Pages
- Landing page and auth pages
- Surveys list/details/take survey flow
- Dashboard
- Responses list/detail
- Profile
- Articles and article detail
- Media feed and media detail
- Training pages
- Consulting services pages and service detail/request flow

### Consulting UX Enhancements (Recent)
- Consulting listing page upgraded with trust-focused hero, improved card hierarchy, and stronger conversion CTA.
- Consulting detail page upgraded with structured content sections (Overview, What We Do, Our Approach, Why It Matters).
- Request panel improved with trust indicators, helper text, inline field validation, loading/disabled states, and success confirmation.
- Name/email autofill added on consultation form when user is authenticated.

### Admin Pages
- Admin dashboard
- Survey management (list/create/edit/analytics)
- Response management
- User management
- Article management
- Media management
- Training management
- Consulting management
- Consulting analytics (period-aware)

## 5. Backend Modules

### Routes
- auth.js
- surveys.js
- responses.js
- articles.js
- users.js
- media.js
- training.js
- consulting.js

### Controllers
- authController.js
- surveyController.js
- responseController.js
- articleController.js
- userController.js
- mediaController.js
- trainingController.js
- consultingController.js

### Other Server Areas
- config/: database connection and config
- middleware/: auth, security, validation, error handling, logging
- utils/: helper utilities (feature-specific)
- uploads/: runtime uploaded assets

## 6. Database Design and Evolution

### Core Domain Tables
- users
- surveys
- questions
- options
- responses
- answers
- articles

### Additional Feature Tables
- signup_otp_verifications (OTP registration flow)
- Media and training-related tables introduced via migrations
- consulting_services and consulting_requests
- consulting_events (consulting engagement events)
- platform_events (unified analytics event store; UI route currently disabled)

### Consulting Data Model (Current)
- `consulting_services`
  - Core fields: title, slug, short_description, content, deliverables, target_audience, is_active
  - Hero fields: hero_subtitle, hero_benefits (JSONB array)
- `consulting_requests`
  - service_id, user_id (nullable), name, email, message, file_url, created_at

### Important Data Rules
- One response per user per survey via unique constraint on (survey_id, user_id).
- FK cascade strategy removes dependent records on parent delete.
- ENUM-driven constraints for user roles, survey status, and question type.

### Migration History
- 01_initial_schema.sql
- 02_add_is_banned.sql
- 03_add_profile_fields.sql
- 04_add_question_type_filters.sql
- 05_add_media_posts.sql
- 06_add_media_details_survey.sql
- 07_refactor_media_to_use_article_id.sql
- 08_create_training_videos.sql
- 09_create_training_playlists.sql
- 10_add_youtube_playlist_url.sql
- 11_add_survey_submission_email_fields.sql
- 12_add_signup_otp_verifications.sql
- 13_add_training_categories_and_notes.sql
- 14_drop_unused_fields.sql
- 15_add_consulting_services.sql
- 16_add_consulting_hero_fields.sql
- 17_add_consulting_events.sql
- 18_add_consulting_request_workflow_fields.sql
- 19_create_platform_events.sql
- 20_remove_consulting_request_assignment.sql

## 7. Local Development Setup

### Prerequisites
- Node.js 18+
- npm 9+
- PostgreSQL 12+

### Environment File
Create .env from .env.example and configure:
- DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, DB_SSL
- SERVER_PORT, NODE_ENV, TRUST_PROXY
- JWT_SECRET, JWT_EXPIRE
- CORS_ORIGINS, RATE_LIMIT_MAX, AUTH_RATE_LIMIT_MAX
- REACT_APP_API_URL
- SMTP_* values if submission email is needed

### Install and Run
From project root:

```bash
npm run install-all
npm run db:init
npm run dev
```

Or run services separately:

```bash
npm run server
npm run client
```

## 8. Build, Deploy, and Operations

### Build and Start
```bash
npm run build
npm start
```

### PM2 Commands
```bash
npm run pm2:start
npm run pm2:restart
npm run pm2:stop
```

### Production Requirements
- Set NODE_ENV=production
- Use strong JWT secret (32+ chars)
- Set trusted CORS origins
- Align SERVER_PORT and frontend API target
- Configure DB SSL when required by managed Postgres
- Configure SMTP for survey confirmation emails
- Place reverse proxy in front of Node and enforce HTTPS

### Smoke Testing
```bash
npm run smoke
```
Includes checks for health, login, and build artifacts.

## 9. Root and Package Scripts

### Root Scripts
- dev: run backend and frontend together
- server: run backend dev mode
- client: run frontend dev mode
- build: build frontend
- smoke: run smoke test script
- start/start:server: run backend production mode
- pm2:start | pm2:restart | pm2:stop
- db:init: initialize DB
- db:sync:prod: backup production, sync local DB to production, verify core table counts
- seed:consulting: seed consulting requests + consulting analytics events
- verify:consulting-seed: verify seeded consulting request/event counts
- install-all/postinstall: install dependencies for root/server/client

### Server Scripts
- start: node index.js
- dev: nodemon index.js
- db:init: node init.js
- seed:consulting: node scripts/seed_consulting_requests_and_events.js

Additional operational script:
- `server/scripts/update_consulting_content.js`: updates consulting copy (short description, hero subtitle, hero benefits, content, deliverables, target audience) by slug.

### Client Scripts
- start: craco start (with NODE_OPTIONS flag)
- build: craco build
- test: craco test

## 10. API Summary

Authentication:
- POST /auth/register
- POST /auth/login
- GET /auth/me

Surveys:
- GET /surveys
- GET /surveys/:id
- POST /surveys (admin)
- PUT /surveys/:id (admin)
- DELETE /surveys/:id (admin)
- POST /surveys/:surveyId/questions (admin)
- POST /surveys/questions/:questionId/options (admin)

Responses:
- POST /responses
- GET /responses/survey/:surveyId
- GET /responses/:responseId
- GET /responses/survey/:surveyId/analytics

Articles:
- GET /articles
- GET /articles/:id
- POST /articles (admin)
- PUT /articles/:id (admin)
- DELETE /articles/:id (admin)
- GET /articles/admin/my-articles (admin)

Additional modules:
- Users API under /users
- Media API under /media
- Training API under /training
- Consulting API under /consulting

Consulting API capabilities now include:
- Public services list and detail retrieval.
- Consultation request submission with optional file upload (authenticated users).
- Event tracking endpoint for consulting views/submits.
- Admin service CRUD including hero fields (`hero_subtitle`, `hero_benefits`).
- Admin consultation request listing with pagination.
- Admin consultation request workflow updates (`status`, `priority`, `notes`).
- Admin consulting analytics overview with period selector (`7d`, `30d`, `all`).
- Admin service analytics endpoint with `days=7|30` support.

For full request/response payloads, see API documentation map below.

## 11. Documentation Map

Primary references in docs/:
- MASTER_PROJECT_DIAGRAM_SPEC.md: Architecture, actor model, route map, and diagram source of truth
- API_DOCUMENTATION.md: Endpoint details and examples
- DATABASE_SCHEMA.md: Table-level schema details
- ADMIN_DASHBOARD_GUIDE.md: Admin workflow guidance
- ENV_SETUP_QUICKSTART.md: Fast environment setup reference
- IMAGE_STORAGE.md: Static vs runtime image storage conventions
- MEDIA_FEED_DOCUMENTATION.md and MEDIA_FEED_SETUP.md: Media module details
- LINKEDIN_SETUP.md: LinkedIn integration setup
- STEP2_BACKEND_SETUP.md and STEP3_FRONTEND_DEVELOPMENT.md: Build-out references
- LANDING_PAGE.md and LANDING_PAGE_SUMMARY.md: Landing page design and implementation notes

Root references:
- README.md: Quick onboarding summary
- SETUP.md: Detailed local setup
- DEPLOYMENT.md: Production deployment runbook
- IMPLEMENTATION_STATUS.md: Build progress tracking

## 12. Current Status Snapshot

- Database foundation: implemented with incremental migrations.
- Backend foundation: implemented with auth, surveys, responses, articles, media, training, consulting, and security middleware.
- Frontend: multi-page user/admin interface implemented.
- Deployment assets: PM2 config, deployment guide, smoke test script available.

### Consulting Module Status
- End-to-end consulting module is production-ready across database, backend API, frontend user pages, and admin management.
- Hero content architecture completed:
  - schema migration added (`hero_subtitle`, `hero_benefits`)
  - backend read/write + validation wired
  - admin UI can edit hero subtitle and multi-item hero benefits
  - detail page consumes DB hero content with safe fallback behavior
- Content refresh completed for all 7 predefined consulting services and persisted in database.
- Seed workflow available for analytics demos and QA:
  - inserts synthetic consultation requests into `consulting_requests`
  - inserts matched `submit` and high-volume `view` events into `consulting_events`
  - supports fast validation of conversion metrics and trend charts in admin analytics

## 13. Maintenance Guidance

- Keep this document updated whenever any of these change:
  - API route signatures
  - Database migrations or schema constraints
  - Environment variables
  - Build/deploy scripts
  - New documentation modules in docs/

- Update cross-doc links and route/module inventories as part of each feature PR.
