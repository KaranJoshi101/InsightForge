# Admin Dashboard Guide

Version: 3.0
Last Updated: 2026-03-29

This guide documents the current admin capabilities and the concrete implementation steps used in this codebase.

## 1. Access, Security, and Routes

### Access model
- Admin pages require authenticated admin users.
- Route protection is enforced on both client and server:
  - Client: Protected admin routes in the app router.
  - Server: `authenticate` + `authorize` middleware on admin APIs.

### Active admin routes
- `/admin`
- `/admin/surveys`
- `/admin/surveys/create`
- `/admin/surveys/:id/edit`
- `/admin/surveys/:id/analytics`
- `/admin/responses`
- `/admin/users`
- `/admin/articles`
- `/admin/media`
- `/admin/training`
- `/admin/consulting`
- `/admin/consulting/analytics`

### Temporarily disabled route
- Unified platform analytics admin page (`/admin/analytics`) is intentionally commented out in the app router.

## 2. Feature Inventory (Current)

### 2.1 Admin Dashboard (`/admin`)
- Doughnut chart modules:
  - Survey category distribution.
  - User status distribution.
  - Article category distribution.
  - Training category status distribution.
- Quick navigation cards for all active admin modules.

### 2.2 Survey Management (`/admin/surveys`)
- Survey listing with search by title.
- Survey status chips and summary counters.
- Create, edit, publish, unpublish, and delete actions.
- One-click survey response export to Excel.
- Jump to survey analytics page.
- Question count display per survey.

### 2.3 Survey Builder (`/admin/surveys/create`, `/admin/surveys/:id/edit`)
- Survey metadata:
  - Title, description.
  - Submission email subject and body.
  - Submission email attachments (upload and remove).
- Question builder:
  - Add, remove, and reorder questions.
  - Required flag per question.
  - Supported types: `text`, `text_only`, `number_only`, `multiple_choice`, `checkbox`, `rating`.
  - Option management for option-based questions.
- Validation:
  - Title required.
  - Question text required.
  - Option-based questions require at least two non-empty options.

### 2.4 Response Hub (`/admin/responses`)
- Survey selector and response table for selected survey.
- URL-synced selected survey ID.
- Search responses by user name, email, or user ID.
- Survey-level analytics summary.
- Export selected survey responses to Excel.
- Link to full survey analytics view.

### 2.5 Survey Analytics (`/admin/surveys/:id/analytics`)
- Question-level analytics with chart rendering:
  - Multiple choice and checkbox distributions.
  - Rating distributions and averages.
  - Text answers listing.
- Respondent list with search.
- Respondent profile quick-view.
- Demographic charts (gender, age, location).

### 2.6 User Management (`/admin/users`)
- Paginated users table.
- Debounced search by name/email.
- Ban and unban flows.
- Permanent delete flow for banned, non-admin users only.
- Extended user profile preview (age, gender, phone, location, bio, timestamps).

### 2.7 Article Management (`/admin/articles`)
- Create, update, publish, unpublish, delete.
- Rich text editor with:
  - Formatting, lists, blockquote, code-block, links, images.
  - Client-side image compression before embed.
  - Link normalization.

### 2.8 Media Management (`/admin/media`)
- Admin mode media grid with create/edit/delete behaviors for media posts.
- Uses the shared media module UI with admin controls enabled.

### 2.9 Training Administration (`/admin/training`)
- Category CRUD.
- Playlist import by YouTube playlist URL.
- Playlist listing and deletion.
- Playlist item drill-down.
- Category notes CRUD.
- Note document upload support.
- Breadcrumb-based navigation through categories, notes, and videos.

### 2.10 Consulting Management (`/admin/consulting`)
- Consulting services CRUD with active/inactive control.
- Service fields:
  - `title`, `slug`, `short_description`, `hero_subtitle`, `hero_benefits`, `content`, `deliverables`, `target_audience`, `is_active`.
- Request operations:
  - Paginated request table.
  - Request detail modal.
  - Workflow updates for `status`, `priority`, and `notes`.
  - Attachment link handling.
- Email helper tools:
  - Template selection.
  - Subject/body auto-fill.
  - Mail client handoff and copy support.
- Note: `assigned_to` was removed from the request workflow and is no longer part of the admin UI/API updates.

### 2.11 Consulting Analytics (`/admin/consulting/analytics`)
- Summary cards:
  - Total views.
  - Total requests.
  - Conversion rate.
  - Unique view context.
- Period selector:
  - Last 7 days.
  - Last 30 days.
  - All time.
- Trend charts scoped to selected period.
- Service conversion table and top-services lists.
- Auto-refresh (60s) and manual refresh button.

## 3. Data Export and File Features

### Exports
- Survey response export to `.xlsx` from:
  - Survey management page.
  - Responses hub.

### Admin-managed uploaded files
- Survey submission email attachments.
- Consulting request attachments.
- Training note document files.

## 4. Implementation Steps (How To Build or Extend Admin Features)

Use this sequence when adding a new admin feature or extending an existing one.

### Step 1: Database schema and migration
1. Add migration SQL under `database/migrations/`.
2. Use additive, backward-compatible schema changes when possible.
3. Update initialization scripts if migration ordering is manually listed.

### Step 2: Server validation rules
1. Add or update request validators in `server/middleware/routeValidators.js`.
2. Enforce type, enum, and required constraints at route level.
3. Keep validation errors explicit and admin-friendly.

### Step 3: Controller implementation
1. Add controller handlers under `server/controllers/` for CRUD/query logic.
2. Sanitize text/HTML inputs where rich content is accepted.
3. Keep business logic in controllers, return consistent JSON response shapes.
4. For analytics endpoints, include cache-control headers for freshness.

### Step 4: Route wiring
1. Register endpoints in `server/routes/*.js`.
2. Protect admin endpoints with `authenticate` and `authorize`.
3. Keep public and parameterized routes ordered correctly.

### Step 5: Client service API layer
1. Add client API methods in `client/src/services/*.js`.
2. Keep method naming consistent with existing patterns.
3. Pass query params (for pagination, filters, period selectors) through `params`.

### Step 6: Admin page UI implementation
1. Build page in `client/src/pages/`.
2. Use shared components (`BackLink`, `LoadingSpinner`, chips/tables/cards).
3. Provide loading, error, empty, and success states.
4. Confirm destructive actions with explicit prompts.

### Step 7: Route registration and navigation
1. Add admin route to app router in `client/src/App.js`.
2. Add a dashboard shortcut card/link where applicable.
3. Ensure route is inside admin-only `ProtectedRoute`.

### Step 8: Data accuracy and analytics checks
1. Cross-check API aggregates against direct SQL counts.
2. Verify period filters (7d/30d/all-time) and conversion math.
3. Prefer source-of-truth tables for key metrics.

### Step 9: Manual QA checklist
1. Verify admin access control with admin and non-admin accounts.
2. Verify CRUD lifecycle end-to-end.
3. Verify search, pagination, export/download flows.
4. Verify charts render with zero-data and non-zero-data sets.
5. Verify validation errors and confirmation dialogs.

### Step 10: Deployment checklist
1. Deploy backend code changes.
2. Deploy frontend build.
3. Apply migrations in production if schema changed.
4. Re-check critical admin flows after deployment.

## 5. Module-Specific Build Recipes

### 5.1 Add a new admin CRUD module
1. Create migration(s) for new entity tables.
2. Add controller CRUD functions.
3. Add protected routes.
4. Add client service methods.
5. Create admin page with list + form + actions.
6. Add admin route and dashboard shortcut.
7. Add docs update in this file.

### 5.2 Add a new admin analytics panel
1. Define metric sources and SQL aggregates.
2. Implement analytics endpoint(s) with optional period parameter.
3. Return both totals and trend arrays in stable shape.
4. Build page cards and charts in admin UI.
5. Add refresh flow and stale-data safeguards.
6. Validate each card against SQL before release.

### 5.3 Add a new admin file upload workflow
1. Configure multer storage and limits in route file.
2. Validate MIME types and size constraints.
3. Store file metadata/URL in DB entity records.
4. Expose links safely in admin UI.
5. Verify server static path and reverse proxy behavior.

## 6. Current Status Summary

- Admin core modules: implemented.
- Consulting request assignment field: removed from workflow.
- Consulting analytics period selector: implemented (7d, 30d, all-time).
- Unified platform analytics page: currently disabled in app routing by design.

For endpoint-level request and response examples, refer to `docs/API_DOCUMENTATION.md`.
