# API Documentation - Survey Application

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require a JWT token. Include it in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 1. Authentication Endpoints

### Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "OTP sent to your email",
  "email": "john@example.com",
  "expires_in_minutes": 10
}
```

**Notes:**
- `/auth/register` initiates OTP-based signup.
- Account creation is completed by `/auth/register/verify-otp`.

---

### Verify Registration OTP
**POST** `/auth/register/verify-otp`

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Get Current User
**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "created_at": "2026-03-06T10:00:00Z"
  }
}
```

---

### Change Password (Authenticated User)
**PUT** `/users/profile/password`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword123!",
  "confirm_new_password": "NewPassword123!"
}
```

**Notes:**
- `current_password` must match the existing password.
- `new_password` must differ from current password.
- In production, strong password policy is enforced (length + upper/lower/number/special).

---

---

## 2. Survey Endpoints

### Get All Surveys
**GET** `/surveys?page=1&limit=10&status=published`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `status` (optional: draft, published, closed)

**Response:**
```json
{
  "surveys": [
    {
      "id": 1,
      "title": "Customer Satisfaction Survey",
      "description": "Help us improve...",
      "created_by": 1,
      "status": "published",
      "created_at": "2026-03-06T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "pages": 1
  }
}
```

---

### Get Survey Details
**GET** `/surveys/:identifier`

**Notes:**
- `identifier` accepts survey slug or legacy numeric id.

**Response:**
```json
{
  "survey": {
    "id": 1,
    "title": "Customer Satisfaction Survey",
    "description": "Help us improve...",
    "created_by": 1,
    "status": "published",
    "created_at": "2026-03-06T10:00:00Z",
    "questions": [
      {
        "id": 1,
        "question_text": "How satisfied are you?",
        "question_type": "rating",
        "is_required": true,
        "order_index": 1,
        "options": []
      }
    ]
  }
}
```

---

### Create Survey (Admin Only)
**POST** `/surveys`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "title": "New Survey",
  "description": "Survey description"
}
```

**Response:**
```json
{
  "message": "Survey created successfully",
  "survey": {
    "id": 5,
    "title": "New Survey",
    "description": "Survey description",
    "created_by": 1,
    "status": "draft",
    "created_at": "2026-03-06T10:00:00Z"
  }
}
```

---

### Update Survey (Admin Only)
**PUT** `/surveys/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "published"
}
```

---

### Delete Survey (Admin Only)
**DELETE** `/surveys/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

---

### Add Question to Survey (Admin Only)
**POST** `/surveys/:surveyId/questions`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "question_text": "What is your age?",
  "question_type": "text",
  "is_required": true,
  "order_index": 2
}
```

---

### Add Option to Question (Admin Only)
**POST** `/surveys/questions/:questionId/options`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "option_text": "Option 1",
  "order_index": 1
}
```

---

## 3. Response Endpoints

### Submit Survey Response
**POST** `/responses`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "survey_id": 1,
  "answers": [
    {
      "question_id": 1,
      "answer_text": "5"
    },
    {
      "question_id": 2,
      "answer_text": "The service is great"
    },
    {
      "question_id": 3,
      "option_id": 5
    }
  ]
}
```

**Response:**
```json
{
  "message": "Response submitted successfully",
  "response_id": 10
}
```

---

### Get Survey Responses (Admin Only)
**GET** `/responses/survey/:surveyId?page=1&limit=10`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "responses": [
    {
      "id": 10,
      "survey_id": 1,
      "user_id": 2,
      "name": "Jane Doe",
      "email": "jane@example.com",
      "submitted_at": "2026-03-06T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5
  }
}
```

---

### Get Response Details
**GET** `/responses/:responseId`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "response": {
    "id": 10,
    "survey_id": 1,
    "user_id": 2,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "submitted_at": "2026-03-06T10:00:00Z",
    "answers": [
      {
        "id": 1,
        "question_id": 1,
        "question_text": "How satisfied?",
        "question_type": "rating",
        "answer_text": "5",
        "option_id": null,
        "option_text": null
      }
    ]
  }
}
```

---

### Get Survey Analytics (Admin Only)
**GET** `/responses/survey/:surveyId/analytics`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response:**
```json
{
  "survey_id": 1,
  "total_responses": 10,
  "analytics": [
    {
      "id": 1,
      "question_text": "How satisfied?",
      "question_type": "rating",
      "total_responses": 10,
      "option_counts": []
    }
  ]
}
```

---

## 4. Article Endpoints

### Get Published Articles
**GET** `/articles?page=1&limit=10`

**Notes:**
- Articles linked to media as Talks are treated as published in API responses.

**Response:**
```json
{
  "articles": [
    {
      "id": 1,
      "title": "Getting Started",
      "content": "This article...",
      "author": 1,
      "author_name": "Admin User",
      "created_at": "2026-03-06T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 3
  }
}
```

---

### Get Article Details
**GET** `/articles/:identifier`

**Notes:**
- `identifier` accepts article slug or legacy numeric id.

**Response:**
```json
{
  "article": {
    "id": 1,
    "title": "Getting Started",
    "content": "This article...",
    "author": 1,
    "author_name": "Admin User",
    "is_published": true,
    "created_at": "2026-03-06T10:00:00Z",
    "updated_at": "2026-03-06T10:00:00Z"
  }
}
```

---

### Create Article (Admin Only)
**POST** `/articles`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "title": "New Article",
  "content": "Article content here..."
}
```

---

### Update Article (Admin Only)
**PUT** `/articles/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "is_published": true
}
```

**Notes:**
- If an article is linked from media (`talk`), setting `is_published=false` is rejected.

---

### Delete Article (Admin Only)
**DELETE** `/articles/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

---

### Get Admin Articles (Admin Only)
**GET** `/articles/admin/my-articles?page=1&limit=10`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Notes:**
- Admin article responses include effective publish state (`is_published`) and `is_talk`.

---

## 5. Media Endpoints

### Get Public Media Feed
**GET** `/media?limit=50`

**Notes:**
- Returns only media posts with `status = published`.

### Get Admin Media Feed (Admin Only)
**GET** `/media/admin/all?limit=100`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Notes:**
- Returns both `draft` and `published` media posts for administration.

### Create Media Post (Admin Only)
**POST** `/media`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body (sample):**
```json
{
  "title": "Media title",
  "description": "Optional summary",
  "image_url": "https://example.com/image.jpg",
  "size": "medium",
  "source": "manual",
  "status": "draft",
  "survey_id": 12,
  "article_id": null
}
```

**Notes:**
- Standalone media defaults to `draft`.
- If `survey_id` or `article_id` is linked, media is auto-published.
- Linked survey/article are auto-published as Feedback/Talk content.

### Publish Media Post (Admin Only)
**PUT** `/media/:id/publish`

### Unpublish Media Post (Admin Only)
**PUT** `/media/:id/unpublish`

**Notes:**
- Media card visibility can be toggled independently.
- Linked Feedback/Talk entities remain published even if media is unpublished.

### Delete Media Post (Admin Only)
**DELETE** `/media/:id`

**Notes:**
- If deleted media was the last link to a survey/article:
  - linked Feedback survey is reverted to `draft`
  - linked Talk article is reverted to `is_published=false`
- If other media posts still link the same entity, it remains in Feedback/Talk published state.

---

## 6. Consulting Endpoints

### Public: Get Active Consulting Services
**GET** `/consulting`

**Response (sample):**
```json
{
  "services": [
    {
      "id": 1,
      "title": "Protocol Development",
      "slug": "protocol-development",
      "short_description": "Design robust clinical and research protocols...",
      "hero_subtitle": "Protocol design support for robust studies",
      "hero_benefits": ["Tailored approach", "Clear deliverables"],
      "content": "<p>...</p>",
      "deliverables": "<ul><li>...</li></ul>",
      "target_audience": "<ul><li>...</li></ul>",
      "is_active": true
    }
  ],
  "count": 7
}
```

---

### Public: Get Consulting Service By Slug
**GET** `/consulting/:slug`

**Response (sample):**
```json
{
  "service": {
    "id": 1,
    "title": "Protocol Development",
    "slug": "protocol-development",
    "short_description": "Design robust clinical and research protocols...",
    "hero_subtitle": "Protocol design support for robust studies",
    "hero_benefits": ["Tailored approach", "Clear deliverables"],
    "content": "<p>Detailed service content...</p>",
    "deliverables": "<ul><li>...</li></ul>",
    "target_audience": "<ul><li>...</li></ul>",
    "is_active": true
  }
}
```

---

### Authenticated: Submit Consultation Request
**POST** `/consulting/request`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Fields:**
- `service_id` (required)
- `name` (required)
- `email` (required)
- `message` (required)
- `file` (optional; pdf/doc/docx/xls/xlsx/csv/txt)

**Response (sample):**
```json
{
  "message": "Consultation request submitted successfully",
  "request": {
    "id": 21,
    "service_id": 3,
    "user_id": 2,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "message": "Need support for sample size planning.",
    "file_url": "/uploads/consulting-requests/1711111111111-a1b2c3-brief.pdf",
    "created_at": "2026-03-29T10:00:00Z"
  }
}
```

---

### Public: Track Consulting Event
**POST** `/consulting/events`

**Request Body (sample):**
```json
{
  "service_id": 3,
  "event_type": "view",
  "session_id": "sess_1711111111111_abcdef1234",
  "metadata": {
    "source": "consulting-detail-page"
  }
}
```

**Notes:**
- Supports optional authenticated user context.
- Valid event types: `view`, `submit`.

---

### Admin: Get Consulting Services (including inactive)
**GET** `/consulting/admin/services`

**Headers:**
```
Authorization: Bearer <admin_token>
```

---

### Admin: Create Consulting Service
**POST** `/consulting`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body (sample):**
```json
{
  "title": "Protocol Development",
  "slug": "protocol-development",
  "short_description": "Design robust protocols.",
  "hero_subtitle": "Protocol support for complex studies",
  "hero_benefits": ["Tailored strategy", "Clear outputs"],
  "content": "<p>Rich HTML content</p>",
  "deliverables": "<ul><li>Deliverable 1</li></ul>",
  "target_audience": "<ul><li>Audience 1</li></ul>",
  "is_active": true
}
```

---

### Admin: Update Consulting Service
**PUT** `/consulting/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

---

### Admin: Delete Consulting Service
**DELETE** `/consulting/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

---

### Admin: List Consultation Requests
**GET** `/consulting/requests?page=1&limit=20`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request status values:**
- `new`, `in_progress`, `waiting_user`, `resolved`, `closed`

**Priority values:**
- `low`, `medium`, `high`, `urgent`

**Notes:**
- Request assignment fields are removed from current workflow.

---

### Admin: Get Consultation Request By ID
**GET** `/consulting/requests/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

---

### Admin: Update Consultation Request Workflow
**PUT** `/consulting/requests/:id`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body (sample):**
```json
{
  "status": "in_progress",
  "priority": "high",
  "notes": "Initial review complete. Waiting for timeline clarification."
}
```

---

### Admin: Consulting Analytics Overview
**GET** `/consulting/analytics/overview?period=30d`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Period options:**
- `7d`
- `30d`
- `all`

**Response highlights:**
- `selected_period`
- `period_metrics`
- `last_7_days`
- `last_30_days`
- `daily_trend`
- `service_metrics`

---

### Admin: Consulting Analytics By Service
**GET** `/consulting/analytics/service/:id?days=30`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Days options:**
- `7`
- `30`

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields",
  "required": ["name", "email", "password"]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication failed",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Only admins can perform this action"
}
```

### 404 Not Found
```json
{
  "error": "Survey not found"
}
```

### 409 Conflict
```json
{
  "error": "Email already registered"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error"
}
```

---

## Test Users (From Seed Data)

### Admin
- Email: `admin@surveyapp.com`
- Password: `admin123`

### Regular Users
- Email: `john@example.com` | Password: `admin123`
- Email: `jane@example.com` | Password: `admin123`
- Email: `bob@example.com` | Password: `admin123`

---

## Development Notes

- All timestamps are in ISO 8601 format
- Pagination defaults: page=1, limit=10
- JWT tokens expire after 7 days
- Passwords are hashed using bcryptjs
- Database runtime uses MySQL (mysql2) with a pg-compatible adapter
