# Survey App Master Diagram Specification

Version: 1.0  
Date: 2026-03-23  
Scope: Full project modeling source for architecture, use case, DFD, sequence, ER/RDBMS, and UML diagrams.

Update note (2026-04-26): Runtime data layer migrated to MySQL with a pg-compatible adapter.

## 1. Purpose

This document is the single source of truth for any diagramming platform.  
It consolidates:
- System boundaries and architecture layers
- Actors and use cases
- Data flow definitions (DFD L0/L1)
- Sequence flow definitions for major actions
- Complete API surface
- Database schema and relationships
- UML-style module/component dependencies

Use this file to generate professional diagrams in Mermaid, Draw.io, Lucidchart, Visio, Excalidraw, Miro, PlantUML, Structurizr, C4 tools, or custom AI generators.

## 2. Project Summary

Product name: Survey App  
Stack: MySQL, Express, React, Node.js  
Primary goals:
- Collect survey responses from users
- Provide analytics, demographics, and export for admins
- Support article publishing workflow
- Provide admin governance (user moderation and dashboards)

Core runtime ports:
- Frontend: 3000
- Backend API: 5000

Base API prefix: /api

## 3. Actor Model

Actors:
- Visitor: Unauthenticated user browsing public pages
- User: Authenticated non-admin account
- Admin: Authenticated privileged account
- System (External): MySQL database
- System (External): Upload storage served by backend /uploads

Actor permissions summary:
- Visitor: Start OTP-gated registration, login, view published surveys, view published articles
- User: Submit survey response, view own responses, view/update profile
- Admin: Survey CRUD, question/option CRUD, response analytics/export/demographics, article CRUD/publish, user governance, dashboard stats

## 4. Frontend Route Map (Use Case Source)

Public routes:
- /
- /login
- /register
- /articles
- /articles/:slug
- /surveys
- /surveys/:slug

Authenticated user routes:
- /dashboard
- /survey/:id/take
- /responses
- /responses/:id
- /profile

Authenticated admin routes:
- /admin
- /admin/articles
- /admin/responses
- /admin/users
- /admin/surveys
- /admin/surveys/create
- /admin/surveys/:id/edit
- /admin/surveys/:id/analytics

## 5. Canonical Use Case Catalog

### Authentication and Access
- UC-A1 Register account (OTP initiation)
- UC-A1b Verify registration OTP
- UC-A2 Login account
- UC-A3 Get current authenticated user (/auth/me)

### Survey Participation (User)
- UC-U1 Browse published surveys
- UC-U2 View survey details and questions
- UC-U3 Submit survey response (single-submit or multi-submit based on survey setting)
- UC-U4 View own response history
- UC-U5 View response detail (own response or admin)

### Survey Administration (Admin)
- UC-S1 Create survey
- UC-S2 Update survey metadata/status
- UC-S3 Delete survey
- UC-S4 Add question to survey
- UC-S5 Update question
- UC-S6 Delete question
- UC-S7 Add option to question
- UC-S8 Update option
- UC-S9 Delete option
- UC-S10 View survey responses (paginated)
- UC-S11 View survey analytics
- UC-S12 View survey demographics
- UC-S13 Export survey responses to Excel

### Article Management
- UC-AR1 View published articles
- UC-AR2 View published article detail
- UC-AR3 Create article (admin)
- UC-AR4 Update article and publish state (admin)
- UC-AR5 Delete article (admin)
- UC-AR6 View own authored admin articles (admin)

### User Governance and Profile
- UC-G1 Get own profile
- UC-G2 Update own profile
- UC-G3 List users (admin)
- UC-G4 Get user by id (admin)
- UC-G5 Ban user (admin)
- UC-G6 Unban user (admin)
- UC-G7 View dashboard stats (admin)

## 6. Architecture Model (Layered)

Layer 1: Client Layer (React)
- AuthContext (token/session state)
- Pages and route guards
- Service adapters (axios wrappers)

Layer 2: API/Edge Layer (Express)
- Routes: auth, surveys, responses, articles, users
- Middleware: auth, authorize, validators, security headers, CORS, rate limit, request logger, error handler

Layer 3: Service Layer (Controllers)
- Auth controller
- Survey controller
- Response controller
- Article controller
- User controller

Layer 4: Data and Storage
- MySQL relational database
- Upload static file storage (/uploads)
- Excel workbook generation engine for exports

## 7. DFD Source Data

### DFD Level 0 (Context)

External entities:
- E1 End User
- E2 Admin

Core process:
- P0 Survey App System

Data stores:
- D0 MySQL
- D1 Upload Storage

Primary flows:
- F1 E1 -> P0: registration/login/profile requests
- F2 E1 -> P0: survey browse/details/submit requests
- F3 P0 -> E1: auth tokens, surveys, response data, articles
- F4 E2 -> P0: survey/admin/article governance commands
- F5 P0 -> E2: analytics/demographics/export files/dashboard metrics
- F6 P0 <-> D0: transactional data read/write
- F7 P0 <-> D1: upload/read article assets

### DFD Level 1 (Process Decomposition)

Processes:
- P1 Auth and session
- P2 Survey management
- P3 Response processing and analytics
- P4 Article management
- P5 User governance and dashboard statistics

Stores:
- D1 users
- D2 surveys
- D3 questions
- D4 options
- D5 responses
- D6 answers
- D7 articles

Flow mapping:
- P1 <-> D1
- P2 <-> D2, D3, D4
- P3 <-> D2, D3, D5, D6
- P4 <-> D7 (+ uploads storage)
- P5 <-> D1, D2, D5, D7

## 8. Sequence Flow Definitions

### SQ-1 Register/Login
1. Visitor submits credentials from UI
2. UI calls /api/auth/register
3. Server issues OTP challenge for signup verification
4. UI calls /api/auth/register/verify-otp
5. UI calls /api/auth/login and AuthContext stores token and user profile

### SQ-2 Admin Creates Survey with Questions
1. Admin opens survey create screen
2. UI POST /api/surveys
3. Admin adds questions via POST /api/surveys/:surveyId/questions
4. Admin adds options via POST /api/surveys/questions/:questionId/options
5. Admin updates status via PUT /api/surveys/:id (draft/published/closed)

### SQ-3 User Submits Response
1. User opens /survey/:id/take and fills answers
2. UI POST /api/responses with survey_id and answers[]
3. Response controller validates survey existence and applies per-survey duplicate policy
4. Controller inserts response row and answer rows in transaction
5. Controller enforces text_only/number_only question constraints
6. Commit and return response_id

### SQ-4 Admin Analytics and Export
1. Admin requests analytics endpoints
2. UI GET /api/responses/survey/:surveyId/analytics
3. UI GET /api/responses/survey/:surveyId/demographics
4. UI GET /api/responses/survey/:surveyId/export
5. Controller aggregates DB data and streams Excel workbook for export

### SQ-5 Article Publish Workflow
1. Admin creates article (draft default)
2. Admin updates article with is_published true
3. Public users read from published-only endpoints

### SQ-6 User Moderation
1. Admin calls PUT /api/users/:id/ban or /unban
2. users.is_banned toggled
3. Updated moderation state appears in admin dashboard and user listings

## 9. API Catalog (Authoritative)

Base URL: http://localhost:5000/api

Auth:
- POST /auth/register (public)
- POST /auth/register/verify-otp (public)
- POST /auth/login (public)
- GET /auth/me (authenticated)

Surveys:
- GET /surveys (public, pagination, optional status)
- GET /surveys/:identifier (public; slug or legacy id)
- POST /surveys (admin)
- PUT /surveys/:id (admin)
- DELETE /surveys/:id (admin)
- POST /surveys/:surveyId/questions (admin)
- POST /surveys/questions/:questionId/options (admin)
- PUT /surveys/questions/:questionId (admin)
- DELETE /surveys/questions/:questionId (admin)
- PUT /surveys/questions/options/:optionId (admin)
- DELETE /surveys/questions/options/:optionId (admin)

Responses:
- POST /responses (authenticated)
- GET /responses/user (authenticated)
- GET /responses/:responseId (authenticated; owner or admin)
- GET /responses/survey/:surveyId (admin)
- GET /responses/survey/:surveyId/analytics (admin)
- GET /responses/survey/:surveyId/demographics (admin)
- GET /responses/survey/:surveyId/export (admin)

Articles:
- GET /articles (public, published only)
- GET /articles/:identifier (public, published only; slug or legacy id)
- GET /articles/admin/my-articles (admin)
- POST /articles (admin)
- PUT /articles/:id (admin)
- DELETE /articles/:id (admin)

Users:
- GET /users/profile (authenticated)
- PUT /users/profile (authenticated)
- GET /users (admin)
- GET /users/dashboard-stats (admin)
- GET /users/:id (admin)
- PUT /users/:id/ban (admin)
- PUT /users/:id/unban (admin)

Media:
- GET /media (public)
- GET /media/:id (public)
- POST /media (admin)
- DELETE /media/:id (admin)

Health/System:
- GET /api/health
- GET /

## 10. Validation and Business Rules

Global validation:
- id params must be positive integers
- pagination: page >= 1, limit in [1, 500]

Authentication:
- JWT bearer token required for protected routes
- Admin routes require role admin

Registration/login:
- Development: password min length 6
- Production: stronger password policy enforced

Survey rules:
- status in {draft, published, closed}
- title length 3..200
- description max length 5000

Question rules:
- Allowed types: multiple_choice, text, rating, checkbox, text_only, number_only
- text_only accepts letters and spaces only
- number_only accepts numeric values only

Response rules:
- One response per (survey_id, user_id)
- answers array size 1..500
- answer_text max length 10000

Article rules:
- title length 3..300
- content length 1..2000000

Media post rules:
- title length 1..500
- image_url required and must be publicly accessible
- size in {small, medium, large}
- source in {manual, linkedin}
- external_id optional, used for tracking LinkedIn posts

Profile rules:
- name 2..100
- location max 120
- age integer, enforced 1..150 at controller
- gender max 30
- phone max 30
- bio max 2000

## 11. Database Canonical Schema

Database: MySQL

Enums:
- user_role: admin, user
- survey_status: draft, published, closed
- question_type: multiple_choice, text, rating, checkbox, text_only, number_only
- media_size: small, medium, large
- media_source: manual, linkedin

Tables:

users
- id PK
- name
- email UNIQUE
- password_hash
- role user_role
- is_banned boolean
- location, age, gender, phone, bio
- created_at, updated_at

surveys
- id PK
- title, description
- created_by FK -> users.id
- status survey_status
- created_at, updated_at

questions
- id PK
- survey_id FK -> surveys.id
- question_text
- question_type question_type
- is_required
- order_index
- created_at, updated_at

options
- id PK
- question_id FK -> questions.id
- option_text
- order_index
- created_at

responses
- id PK
- survey_id FK -> surveys.id
- user_id FK -> users.id
- submitted_at, created_at
- Duplicate policy enforced by survey.allow_multiple_submissions

answers
- id PK
- response_id FK -> responses.id
- question_id FK -> questions.id
- answer_text
- option_id FK -> options.id (nullable)
- created_at

articles
- id PK
- title
- content
- author FK -> users.id
- is_published
- created_at, updated_at

media_posts
- id PK
- title
- description (nullable)
- image_url
- size media_size
- source media_source
- external_id VARCHAR (UNIQUE, nullable, for LinkedIn tracking)
- created_at, updated_at

Indexes (core):
- surveys.created_by
- questions.survey_id
- options.question_id
- responses.survey_id
- responses.user_id
- answers.response_id
- answers.question_id
- articles.author
- users.is_banned
- media_posts.created_at (for sorting)
- media_posts.source (for filtering)
- media_posts.external_id (for duplicate prevention)

## 12. ER Relationship Matrix

- users 1:N surveys (created_by)
- users 1:N responses (user_id)
- users 1:N articles (author)
- surveys 1:N questions
- surveys 1:N responses
- questions 1:N options
- questions 1:N answers
- responses 1:N answers
- options 1:N answers (optional reference)

## 13. UML Component Source Model

Client-side logical modules:
- AuthContext (session state, token lifecycle)
- SurveyService (survey and question/option operations)
- ResponseService (submit, analytics, demographics, export)
- ArticleService (public and admin article operations)
- MediaGrid (Pinterest-style responsive media feed)
- Route-level pages (user/admin screens)

Server-side logical modules:
- Middleware: authenticate, authorize, validators, security, error handler
- Controllers: auth, survey, response, article, user, media
- Routes: auth.js, surveys.js, responses.js, articles.js, users.js, media.js
- Utilities: linkedinIntegration.js (for LinkedIn post sync)
- Data access: MySQL (mysql2) with pg-compatible query adapter

Primary dependencies:
- Client services -> API routes
- API routes -> middleware -> controllers
- Controllers -> database
- Article controller -> uploads storage path
- Response controller -> ExcelJS export engine
- Media controller -> linkedinIntegration util (for LinkedIn sync)

## 14. Security and Operational Constraints

Security controls:
- CORS options middleware
- Global rate limit
- Security headers
- Role-based access checks for admin endpoints
- Production config guard for CORS and strong JWT secret

Payload constraints:
- JSON body limit: dev 50mb, production 100kb

Operational endpoints:
- /api/health for uptime checks

## 15. Diagram Platform Input Blocks (Machine-Friendly)

Use the blocks below directly in AI diagram generators.

### Block A: Architecture Nodes and Edges

```yaml
nodes:
  - id: actor_user
    type: actor
    label: End User
  - id: actor_admin
    type: actor
    label: Admin
  - id: client_react
    type: component
    label: React Client
  - id: edge_api
    type: component
    label: Express API Gateway
  - id: svc_auth
    type: service
    label: Auth Controller
  - id: svc_survey
    type: service
    label: Survey Controller
  - id: svc_response
    type: service
    label: Response Controller
  - id: svc_article
    type: service
    label: Article Controller
  - id: svc_user
    type: service
    label: User Controller
  - id: db_pg
    type: datastore
    label: MySQL
  - id: fs_uploads
    type: datastore
    label: Upload Storage
  - id: excel_engine
    type: utility
    label: Excel Export Engine
edges:
  - actor_user -> client_react
  - actor_admin -> client_react
  - client_react -> edge_api
  - edge_api -> svc_auth
  - edge_api -> svc_survey
  - edge_api -> svc_response
  - edge_api -> svc_article
  - edge_api -> svc_user
  - svc_auth -> db_pg
  - svc_survey -> db_pg
  - svc_response -> db_pg
  - svc_article -> db_pg
  - svc_user -> db_pg
  - svc_article -> fs_uploads
  - svc_response -> excel_engine
```

### Block B: DFD L1 Processes and Stores

```yaml
processes:
  - P1: Auth and Session
  - P2: Survey Management
  - P3: Response Processing and Analytics
  - P4: Article Management
  - P5: User Governance and Dashboard
stores:
  - D1: users
  - D2: surveys
  - D3: questions
  - D4: options
  - D5: responses
  - D6: answers
  - D7: articles
flows:
  - P1 <-> D1
  - P2 <-> D2
  - P2 <-> D3
  - P2 <-> D4
  - P3 <-> D2
  - P3 <-> D3
  - P3 <-> D5
  - P3 <-> D6
  - P4 <-> D7
  - P5 <-> D1
  - P5 <-> D2
  - P5 <-> D5
  - P5 <-> D7
```

### Block C: ER Entities

```yaml
entities:
  - users(id PK, email UK, role, is_banned, location, age, gender, phone, bio)
  - surveys(id PK, created_by FK->users.id, status)
  - questions(id PK, survey_id FK->surveys.id, question_type, is_required, order_index)
  - options(id PK, question_id FK->questions.id, order_index)
  - responses(id PK, survey_id FK->surveys.id, user_id FK->users.id, dedupe policy from surveys.allow_multiple_submissions)
  - answers(id PK, response_id FK->responses.id, question_id FK->questions.id, option_id FK->options.id nullable)
  - articles(id PK, author FK->users.id, is_published)
relations:
  - users 1..* surveys
  - users 1..* responses
  - users 1..* articles
  - surveys 1..* questions
  - surveys 1..* responses
  - questions 1..* options
  - questions 1..* answers
  - responses 1..* answers
  - options 0..* answers
```

### Block D: Use Case Matrix

```yaml
actors:
  - Visitor
  - User
  - Admin
use_cases:
  - Visitor: [Start OTP Registration, Verify OTP, Login, View Published Surveys, View Published Articles]
  - User: [Get Current User, Submit Response, View My Responses, View Response Detail, View/Update Profile]
  - Admin: [Survey CRUD, Question CRUD, Option CRUD, Survey Analytics, Survey Demographics, Export Excel, Article CRUD/Publish, List Users, Ban/Unban Users, Dashboard Stats]
```

## 16. How to Use This File in Any Platform

1. For architecture diagrams: use Section 6 and Block A.
2. For use case diagrams: use Section 5 and Block D.
3. For DFD L0/L1: use Section 7 and Block B.
4. For sequence diagrams: use Section 8.
5. For ER/RDBMS diagrams: use Sections 11 and 12 plus Block C.
6. For UML component/class/module diagrams: use Section 13.

This file intentionally avoids tool-specific syntax lock-in so it can be consumed by most diagram platforms directly.
