# Admin Dashboard Guide

Version: 2.0
Last Updated: 2026-03-29

This guide documents all admin features currently available in the platform.

## 1. Access and Permissions

### Who can use admin pages
- Only users with admin role can access admin routes.
- Non-admin users are redirected away from admin pages.

### Admin route map
- /admin
- /admin/surveys
- /admin/surveys/create
- /admin/surveys/:id/edit
- /admin/surveys/:id/analytics
- /admin/responses
- /admin/users
- /admin/articles
- /admin/media
- /admin/training
- /admin/consulting
- /admin/consulting/analytics

## 2. Admin Dashboard (/admin)

### What it shows
- Survey category distribution chart.
- User status distribution chart.
- Article category distribution chart.
- Training category status distribution chart.

### Management shortcuts
- Manage Surveys
- Manage Users
- Manage Articles
- Manage Media
- Manage Training Categories
- Manage Consulting
- Consulting Analytics

## 3. Survey Management (/admin/surveys)

### Capabilities
- View all surveys in a table.
- Search surveys by name.
- View status chips (published/draft).
- Create new survey.
- Edit existing survey.
- Open per-survey analytics page.
- Export survey responses to Excel.
- Publish draft surveys.
- Unpublish published surveys.
- Delete surveys.

### Included indicators
- Total surveys
- Published count
- Draft count

## 4. Survey Builder (/admin/surveys/create and /admin/surveys/:id/edit)

### Survey-level controls
- Title and description.
- Submission email subject/body.
- Submission email attachment uploads.

### Question builder
- Add/remove/reorder questions by form order.
- Supported types:
  - Long Text
  - Short Text (text only)
  - Number Only
  - Multiple Choice
  - Checkbox
  - Rating
- Mark question required/optional.
- Add/edit/delete options for option-based questions.

### Validation and save behavior
- Title required.
- Question text required.
- Option-based questions require at least 2 non-empty options.
- Create and edit flows both supported.

## 5. Survey Responses Hub (/admin/responses)

### Capabilities
- Select any survey from sidebar list.
- Load responses for selected survey.
- Search responses by user name, user email, or user ID.
- View analytics summary for selected survey.
- Export selected survey responses to Excel.
- Open full analytics page for selected survey.

### Summary stats shown
- Total responses
- Unique users
- Questions count

## 6. Survey Analytics (/admin/surveys/:id/analytics)

### Capabilities
- Detailed question-level analytics using charts.
- Multiple choice and checkbox analytics:
  - Bar chart + doughnut chart
  - Option counts and percentages
- Rating analytics:
  - Distribution chart
  - Average rating
- Text-response analytics:
  - Scrollable response list with respondent names
- Respondent list and search.
- User profile quick view for respondents.

### Demographics section
- Gender distribution
- Age distribution
- Location distribution

## 7. User Management (/admin/users)

### Capabilities
- Paginated user table.
- Search users by name or email (debounced).
- View user role and status.
- Ban user.
- Unban user.
- Permanently delete banned non-admin user.
- Open user profile modal with extended profile fields.

### Profile modal fields
- Name
- Email
- Role
- Status
- Age
- Gender
- Phone
- Location
- Bio
- Member since

## 8. Article Management (/admin/articles)

### Capabilities
- Create article with rich-text editor.
- Edit existing article.
- Publish article.
- Unpublish article.
- Delete article.

### Editor features
- Rich text formatting (headers, emphasis, lists, quotes, code blocks).
- Links and image embedding.
- Client-side image handling/compression before embed.
- Content normalization for links.

### Validation
- Title length constraints.
- Non-empty content checks.

## 9. Media Management (/admin/media)

### Capabilities
- Create media posts.
- Edit media posts.
- Delete media posts.
- Manage public media feed content through admin mode grid.

## 10. Training Administration (/admin/training)

### Capabilities
- Create/edit/delete training categories.
- Import YouTube playlist by URL into selected category.
- View and delete imported playlists.
- Open playlist items under selected playlist.
- Create/edit/delete category notes.
- Upload note documents and attach document URLs.

### Navigation model in page
- Breadcrumb flow from Categories to Notes or Videos.
- Category-first management pattern.

## 11. Consulting Management (/admin/consulting)

### Service content CRUD
- Create consulting service.
- Edit consulting service.
- Delete consulting service.
- Toggle active/inactive state.

### Fields supported in admin form
- title
- slug
- short_description
- hero_subtitle
- hero_benefits (one item per line)
- content (rich text)
- deliverables (rich text)
- target_audience (rich text)
- is_active

### Requests review
- View consultation requests table.
- Fields displayed:
  - Service
  - Requester
  - Email
  - Status
  - Priority
  - Assigned admin
  - Submission time
- Paginated request browsing.

### Request detail and workflow actions
- Open request detail modal from the requests table.
- Review full request context:
  - Message
  - Attachment link (download/open)
  - Service and requester metadata
- Update internal workflow fields:
  - status (new, in_progress, waiting_user, resolved, closed)
  - priority (low, medium, high, urgent)
  - assigned_to (admin user)
  - notes (internal handling notes)
- Save workflow updates directly from modal.

### Email response support
- Select from prebuilt reply templates.
- Auto-fill template subject and body using request context.
- Edit subject/body before sending.
- Launch default email client via mailto action.
- Copy email message body to clipboard.

## 12. Consulting Analytics (/admin/consulting/analytics)

### Summary cards
- Total Views
- Total Requests
- Conversion Rate

### Trend charts
- Views over time (30 days)
- Requests over time (30 days)

### Service-level table
- Service name
- Views
- Requests
- Conversion %

### Top service panels
- Most viewed services
- Most requested services

## 13. Data Exports and Files

### Excel exports available
- Survey responses export from Manage Surveys.
- Survey responses export from Responses hub.

### File attachments managed in admin
- Survey submission email attachments.
- Consulting request file attachments (view links in request table).
- Training note document uploads.

## 14. Operational Notes for Admins

- Admin pages use asynchronous loading and show loading indicators for long operations.
- Most destructive actions require confirmation dialogs.
- Success and error notifications are surfaced inline in each page.
- Role enforcement occurs server-side and client-side route protection is also enabled.

## 15. Feature Quick Checklist

- Dashboard charts: available
- Survey CRUD + publish flow: available
- Survey builder with advanced question types: available
- Survey responses + analytics + export: available
- User moderation (ban/unban/delete banned): available
- Article authoring and publish control: available
- Media content administration: available
- Training categories/playlists/notes management: available
- Consulting services CRUD + request workflow + templated email reply: available
- Consulting analytics (views/requests/conversion): available

For API-level details behind these features, see docs/API_DOCUMENTATION.md.
