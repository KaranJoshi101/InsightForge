# Survey App: Page Styling and Structure Reference

## 1. Styling Architecture

### Global styling base
- Primary global stylesheet: `client/src/index.css`
- Shared design language:
	- Primary color: `#003594`
	- Accent color: `#FFB81C`
	- Background neutral: `#E8E9EE`
	- Text: `#2B2B2B`
- Shared utility/layout classes:
	- Containers: `.container`, `.page-shell-wide`
	- Header blocks: `.page-header`, `.admin-page-header`, `.page-header-title`, `.page-header-subtitle`
	- Cards/tables/forms: `.card`, `.card-body`, `.admin-table`, `.form-group`
	- Buttons/chips: `.btn`, `.admin-chip`, `.admin-page-actions`
	- Spacing/flex utilities: `.mt-*`, `.mb-*`, `.gap-*`, `.flex`, `.align-center`, `.justify-*`

### Page-specific stylesheets
- `client/src/pages/LandingPage.css`
	- Dedicated landing visual system (`.academic-landing`, `.acad-*` classes)
	- Sticky academic navbar, hero gradients, card grids, publication list, responsive sections
- `client/src/pages/TrainingPage.css`
	- Dedicated training module UI (`.training-*`, `.playlist-*`, `.player-*` classes)
	- Playlist cards, video player layout, training notes/video section controls

### Third-party style import
- `client/src/pages/AdminArticlesPage.js`
	- Imports `react-quill-new/dist/quill.snow.css` for rich text editor toolbar/content styles

### Inline style usage
- Many pages use inline style objects for local visual tweaks (colors, spacing, typography) on top of global classes.
- Common pattern: global class for structure + inline override for one-off spacing/color.

## 2. App Shell and Navigation Structure

### App shell
- File: `client/src/App.js`
- Root structure:
	- `<Navbar />`
	- `<main style={{ minHeight: 'calc(100vh - 60px)', paddingBottom: '32px' }}>`
	- `<Routes />`

### Navbar behavior
- File: `client/src/components/Navbar.js`
- Uses inline styles for top bar visual treatment.
- Hidden on: `/`, `/login`, `/register`
- For unauthenticated users, public-only routes have page-specific nav handling.

## 3. Route to Page Mapping (All Routed Pages)

| Route | Access | Page Component | Structure Summary | Styling Source |
|---|---|---|---|---|
| `/` | Public | `LandingPage` | Single long-form marketing page: academic navbar, hero, about, research cards, publications, contact/footer sections | `LandingPage.css` + minimal inline |
| `/login` | Public | `LoginPage` | Auth form shell with inputs/actions and route links | `index.css` auth classes + inline |
| `/register` | Public | `RegisterPage` | Auth form shell with registration fields and submit CTA | `index.css` auth classes + inline |
| `/articles` | Public | `ArticlesPage` | Listing page: header + card list + pagination | `index.css` (`container`, `card`, `pagination`) + inline |
| `/articles/:id` | Public | `ArticleDetailPage` | Detail view: back link + article card/content | `index.css` + inline |
| `/training` | Public | `TrainingPage` | Multi-state training UI: category grid, playlist/video player, notes sections | `TrainingPage.css` + `index.css` utilities |
| `/consulting` | Public | `ConsultingPage` | Service listing: hero card + consulting service cards grid | `index.css` + consulting-specific classes in `index.css` + inline |
| `/consulting/:slug` | Public | `ConsultingDetailPage` | Service detail: hero, rich content sections, deliverables, request form sidebar | `index.css` consulting classes + inline |
| `/surveys` | Public | `SurveysPage` | Search + survey cards list (non-feedback user surveys section) | `index.css` (`survey-card`, chips, toolbar classes) + inline |
| `/surveys/:id` | Public | `SurveyDetailPage` | Survey detail with questions summary and action area | `index.css` + inline |
| `/dashboard` | Protected User | `DashboardPage` | User home with action cards/quick links | `index.css` dashboard classes + inline |
| `/survey/:id/take` | Protected User | `TakeSurveyPage` | Question form flow and submission CTA | `index.css` form/button styles + inline |
| `/responses` | Protected User | `ResponsesPage` | User responses list with filtering/cards/table-like groupings | `index.css` + inline |
| `/responses/:id` | Protected User | `ResponseDetailPage` | Single response detail breakdown | `index.css` + inline |
| `/profile` | Protected User | `ProfilePage` | Profile information form/card layout | `index.css` forms/cards + inline |
| `/media` | Public | `MediaPage` | Header shell and media feed grid component | `index.css` page header/shell + component styles |
| `/media/:id` | Public | `MediaDetailPage` | Media article/detail view + related actions | `index.css` + inline |
| `/admin` | Protected Admin | `AdminDashboardPage` | Admin summary dashboard with metric cards and Chart.js doughnuts | `index.css` admin dashboard classes + inline |
| `/admin/articles` | Protected Admin | `AdminArticlesPage` | CRUD/article management form + listing + status actions | `index.css` + Quill snow CSS + inline |
| `/admin/responses` | Protected Admin | `AdminResponsesPage` | Responses management with search/filter/export actions | `index.css` admin/table/card classes + inline |
| `/admin/users` | Protected Admin | `AdminUsersPage` | User management table with ban/unban/reset actions | `index.css` admin/table/button classes + inline |
| `/admin/surveys` | Protected Admin | `AdminSurveysPage` | Surveys management table (status, question count, actions) | `index.css` admin header/table/chips + inline |
| `/admin/surveys/create` | Protected Admin | `CreateSurveyPage` | Survey builder/editor form (used for create mode) | `index.css` forms/cards + inline |
| `/admin/surveys/:id/edit` | Protected Admin | `CreateSurveyPage` | Same component in edit mode | `index.css` forms/cards + inline |
| `/admin/surveys/:id/analytics` | Protected Admin | `SurveyAnalyticsPage` | Survey analytics charts/tables and summary metrics | `index.css` admin card/table/chart wrappers + inline |
| `/admin/media` | Protected Admin | `AdminMediaPage` | Media management board/table/forms | `index.css` admin classes + inline |
| `/admin/training` | Protected Admin | `AdminTrainingPage` | Training categories/playlists/notes administration layout | `index.css` admin patterns + inline |
| `/admin/consulting` | Protected Admin | `AdminConsultingPage` | Consulting services and request workflow management UI | `index.css` admin/consulting classes + inline |
| `/admin/consulting/analytics` | Protected Admin | `AdminConsultingAnalyticsPage` | Consulting analytics dashboard with charts and metric blocks | `index.css` analytics/admin classes + inline |
| `/admin/analytics` | Protected Admin | `AdminAnalyticsPage` | Unified cross-module analytics dashboard | `index.css` analytics/admin classes + inline |

### Catch-all route
- `*` -> redirects to `/`

## 4. Non-route Page Files (Still Part of Page Layer)

| File | Role | Styling |
|---|---|---|
| `client/src/pages/LandingPage.css` | Dedicated stylesheet for landing page sections | Local `.acad-*` system |
| `client/src/pages/TrainingPage.css` | Dedicated stylesheet for training page | Local `.training-*`, `.playlist-*`, `.player-*` |
| `client/src/pages/TrainingPage.css.tmp` | Temporary/backup style file (not imported by app routes) | Not active in runtime unless imported |

## 5. Common Page Structure Patterns

### Content shell patterns
- Public content pages commonly use:
	- `<div className="container mt-4"> ... </div>`
	- or `<div className="page-shell-wide"> ... </div>`

### Header patterns
- User/public module pages:
	- `.page-header`, `.page-header-title`, `.page-header-subtitle`
- Admin module pages:
	- `.admin-page-header` with `.admin-page-actions`

### Data presentation patterns
- List/grid pages:
	- cards (`.card`, custom card classes)
	- feature grids (module-specific classes)
- Admin and analytics pages:
	- `.admin-table`, metric cards, chart wrappers

### Form patterns
- `.form-group`, input/textarea/select global styling from `index.css`
- Validation and status messaging:
	- `.alert`, `.alert-danger`, `.alert-success`, inline helper/error text blocks

## 6. Styling Governance Notes

- The app currently uses a hybrid style strategy:
	- global reusable CSS classes
	- module-specific CSS files for large custom pages (landing/training)
	- inline styles for targeted adjustments
- For maintainability, prefer this order when adding new page styles:
	1. existing global class
	2. module/page class in relevant stylesheet
	3. inline style only for one-off values
- Admin visual consistency should continue to use `.admin-page-header`, `.admin-chip`, `.admin-table`, and `.btn` patterns.

