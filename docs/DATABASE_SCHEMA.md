# Database Schema Documentation

## Overview

Survey App uses MySQL 8 in runtime with a pg-compatible adapter in the server data layer.
The schema supports user management, survey creation, response collection, content publishing, and analytics/event tracking.

## Core Tables

### users
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT AUTO_INCREMENT | PRIMARY KEY | Unique user id |
| name | VARCHAR(255) | NOT NULL | Full name |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Email address |
| password_hash | VARCHAR(255) | NOT NULL | Hashed password |
| role | ENUM('admin','user') | DEFAULT 'user' | Access role |
| is_banned | BOOLEAN | DEFAULT FALSE | Moderation flag |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Created time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Updated time |

### surveys
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT AUTO_INCREMENT | PRIMARY KEY | Unique survey id |
| title | VARCHAR(255) | NOT NULL | Survey title |
| slug | VARCHAR(120) | UNIQUE | SEO/public identifier |
| description | TEXT | NULL | Survey description |
| created_by | INT | NOT NULL, FK -> users.id | Creator |
| status | ENUM('draft','published','closed') | DEFAULT 'draft' | Lifecycle status |
| allow_multiple_submissions | BOOLEAN | DEFAULT FALSE | Submission policy switch |
| is_anonymous | BOOLEAN | DEFAULT FALSE | Hide identity in responses |
| collect_email | BOOLEAN | DEFAULT FALSE | Collect respondent email |
| expiry_date | DATETIME | NULL | Optional close date |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Created time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Updated time |

### questions
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT AUTO_INCREMENT | PRIMARY KEY | Unique question id |
| survey_id | INT | NOT NULL, FK -> surveys.id | Parent survey |
| question_text | TEXT | NOT NULL | Question body |
| question_type | ENUM('multiple_choice','text','rating','checkbox','text_only','number_only') | NOT NULL | Response type |
| is_required | BOOLEAN | DEFAULT TRUE | Required answer |
| order_index | INT | NULL | Display order |
| description | TEXT | NULL | Optional extended description |
| help_text | TEXT | NULL | Optional helper text |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Created time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Updated time |

### options
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT AUTO_INCREMENT | PRIMARY KEY | Unique option id |
| question_id | INT | NOT NULL, FK -> questions.id | Parent question |
| option_text | VARCHAR(255) | NOT NULL | Option label |
| order_index | INT | NULL | Display order |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Created time |

### responses
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT AUTO_INCREMENT | PRIMARY KEY | Unique response id |
| survey_id | INT | NOT NULL, FK -> surveys.id | Parent survey |
| user_id | INT | NOT NULL, FK -> users.id | Respondent |
| submitted_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Submission time |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Created time |

Notes:
- Duplicate submission behavior is controlled by surveys.allow_multiple_submissions.
- Duplicate checks are enforced in application logic for survey submission.

### answers
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT AUTO_INCREMENT | PRIMARY KEY | Unique answer id |
| response_id | INT | NOT NULL, FK -> responses.id | Parent response |
| question_id | INT | NOT NULL, FK -> questions.id | Parent question |
| answer_text | TEXT | NULL | Text answer |
| option_id | INT | NULL, FK -> options.id | Choice answer |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Created time |

### articles
| Column | Type | Constraints | Description |
|---|---|---|---|
| id | INT AUTO_INCREMENT | PRIMARY KEY | Unique article id |
| title | VARCHAR(255) | NOT NULL | Article title |
| slug | VARCHAR(120) | UNIQUE | SEO/public identifier |
| content | LONGTEXT | NOT NULL | Article body |
| author | INT | NOT NULL, FK -> users.id | Author |
| is_published | BOOLEAN | DEFAULT FALSE | Publish flag |
| meta_description | VARCHAR(160) | NULL | SEO description |
| tags | TEXT | NULL | Comma-separated tags |
| reading_time_minutes | INT | DEFAULT 1 | Estimated reading time |
| scheduled_publish_at | DATETIME | NULL | Optional scheduled publish time |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Created time |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Updated time |

## Additional Feature Areas

- Media: media_posts and related linkage fields for survey/article-backed cards.
- OTP registration: signup_otp_verifications.
- Consulting: consulting_services, consulting_requests, consulting_events.
- Training: training_categories, training_videos, training_playlists, playlist_items, training_notes.
- Analytics/eventing: platform_events.
- Draft/autosave: survey_drafts and article_drafts.

## Relationship Highlights

- users 1:N surveys (created_by)
- users 1:N responses (user_id)
- users 1:N articles (author)
- surveys 1:N questions
- surveys 1:N responses
- questions 1:N options
- responses 1:N answers
- questions 1:N answers

## Notes

- ID columns are auto-incrementing integers.
- Foreign keys are indexed to support common joins and admin/reporting queries.
- Password values are stored only as hashes.
- Use database/mysql/schema.sql as the canonical implementation source for migrations/bootstrap behavior.
