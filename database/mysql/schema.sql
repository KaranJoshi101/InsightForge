SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    location VARCHAR(255) DEFAULT NULL,
    age INT DEFAULT NULL,
    gender VARCHAR(50) DEFAULT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    bio TEXT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS surveys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(120) DEFAULT NULL,
    description TEXT,
    created_by INT NOT NULL,
    status ENUM('draft', 'published', 'closed') NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    submission_email_subject VARCHAR(255) DEFAULT NULL,
    submission_email_body TEXT,
    submission_email_attachments JSON NOT NULL DEFAULT (JSON_ARRAY()),
    allow_multiple_submissions BOOLEAN NOT NULL DEFAULT FALSE,
    expiry_date DATETIME DEFAULT NULL,
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    collect_email BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_surveys_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('multiple_choice', 'text', 'rating', 'checkbox', 'text_only', 'number_only') NOT NULL,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    order_index INT DEFAULT NULL,
    description TEXT,
    help_text TEXT,
    validation_rules JSON NOT NULL DEFAULT (JSON_OBJECT()),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_questions_survey_id FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    option_text VARCHAR(255) NOT NULL,
    order_index INT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_options_question_id FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_id INT NOT NULL,
    user_id INT NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_partial BOOLEAN NOT NULL DEFAULT FALSE,
    last_question_index INT NOT NULL DEFAULT 0,
    UNIQUE KEY uq_responses_survey_user (survey_id, user_id),
    CONSTRAINT fk_responses_survey_id FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    CONSTRAINT fk_responses_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    response_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_text TEXT,
    option_id INT DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_answers_response_id FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE,
    CONSTRAINT fk_answers_question_id FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    CONSTRAINT fk_answers_option_id FOREIGN KEY (option_id) REFERENCES options(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS articles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) DEFAULT NULL,
    content LONGTEXT NOT NULL,
    author INT NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    meta_description VARCHAR(160) DEFAULT NULL,
    tags TEXT,
    reading_time_minutes INT NOT NULL DEFAULT 1,
    scheduled_publish_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_articles_author FOREIGN KEY (author) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS media_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    size ENUM('small', 'medium', 'large') NOT NULL DEFAULT 'medium',
    source ENUM('manual', 'linkedin') NOT NULL DEFAULT 'manual',
    external_id VARCHAR(255) DEFAULT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    survey_id INT DEFAULT NULL,
    article_id INT DEFAULT NULL,
    UNIQUE KEY uq_media_posts_external_id (external_id),
    CONSTRAINT fk_media_posts_survey_id FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE SET NULL,
    CONSTRAINT fk_media_posts_article_id FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS signup_otp_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_signup_otp_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS consulting_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL,
    short_description TEXT NOT NULL,
    content LONGTEXT NOT NULL,
    deliverables TEXT,
    target_audience TEXT,
    hero_subtitle TEXT,
    hero_benefits JSON NOT NULL DEFAULT (JSON_ARRAY()),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_consulting_services_slug (slug)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS consulting_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    user_id INT DEFAULT NULL,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    file_url VARCHAR(1000) DEFAULT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'new',
    assigned_to INT DEFAULT NULL,
    priority VARCHAR(16) NOT NULL DEFAULT 'medium',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_consulting_requests_service_id FOREIGN KEY (service_id) REFERENCES consulting_services(id) ON DELETE CASCADE,
    CONSTRAINT fk_consulting_requests_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_consulting_requests_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS consulting_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id INT NOT NULL,
    event_type VARCHAR(32) NOT NULL,
    user_id INT DEFAULT NULL,
    session_id TEXT,
    metadata JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_consulting_events_service_id FOREIGN KEY (service_id) REFERENCES consulting_services(id) ON DELETE CASCADE,
    CONSTRAINT fk_consulting_events_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS platform_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64) NOT NULL,
    entity_id INT DEFAULT NULL,
    user_id INT DEFAULT NULL,
    session_id TEXT,
    metadata JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_platform_events_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS training_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_training_categories_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS training_videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    youtube_id VARCHAR(32) NOT NULL,
    duration_minutes INT DEFAULT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_training_videos_youtube_id (youtube_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS training_playlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    youtube_playlist_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_training_playlists_category_id FOREIGN KEY (category_id) REFERENCES training_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS playlist_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    playlist_id INT NOT NULL,
    video_id INT NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_playlist_items_playlist_video (playlist_id, video_id),
    CONSTRAINT fk_playlist_items_playlist_id FOREIGN KEY (playlist_id) REFERENCES training_playlists(id) ON DELETE CASCADE,
    CONSTRAINT fk_playlist_items_video_id FOREIGN KEY (video_id) REFERENCES training_videos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS training_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    document_url VARCHAR(1000) DEFAULT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_training_notes_category_id FOREIGN KEY (category_id) REFERENCES training_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS survey_conditional_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_id INT NOT NULL,
    condition_question_id INT NOT NULL,
    condition_value TEXT NOT NULL,
    target_question_id INT NOT NULL,
    action VARCHAR(50) NOT NULL DEFAULT 'show',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_survey_conditional_pair (condition_question_id, target_question_id),
    CONSTRAINT fk_survey_conditional_rules_survey_id FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE,
    CONSTRAINT fk_survey_conditional_rules_condition_question_id FOREIGN KEY (condition_question_id) REFERENCES questions(id) ON DELETE CASCADE,
    CONSTRAINT fk_survey_conditional_rules_target_question_id FOREIGN KEY (target_question_id) REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS survey_drafts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    survey_id INT DEFAULT NULL,
    user_id INT NOT NULL,
    title VARCHAR(255) DEFAULT NULL,
    description TEXT,
    questions JSON NOT NULL DEFAULT (JSON_ARRAY()),
    survey_settings JSON NOT NULL DEFAULT (JSON_OBJECT()),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_survey_drafts_survey_id FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE SET NULL,
    CONSTRAINT fk_survey_drafts_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS article_drafts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    article_id INT DEFAULT NULL,
    user_id INT NOT NULL,
    title VARCHAR(255) DEFAULT NULL,
    content LONGTEXT,
    meta_description VARCHAR(160) DEFAULT NULL,
    tags TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_article_drafts_article_id FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL,
    CONSTRAINT fk_article_drafts_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_users_is_banned ON users (is_banned);
CREATE INDEX idx_surveys_created_by ON surveys (created_by);
CREATE UNIQUE INDEX idx_surveys_slug_unique ON surveys (slug);
CREATE INDEX idx_questions_survey_id ON questions (survey_id);
CREATE INDEX idx_options_question_id ON options (question_id);
CREATE INDEX idx_responses_survey_id ON responses (survey_id);
CREATE INDEX idx_responses_user_id ON responses (user_id);
CREATE INDEX idx_answers_response_id ON answers (response_id);
CREATE INDEX idx_answers_question_id ON answers (question_id);
CREATE INDEX idx_articles_author ON articles (author);
CREATE INDEX idx_articles_slug ON articles (slug);
CREATE INDEX idx_articles_scheduled_publish_at ON articles (scheduled_publish_at);
CREATE INDEX idx_signup_otp_email ON signup_otp_verifications (email);
CREATE INDEX idx_signup_otp_expires_at ON signup_otp_verifications (expires_at);
CREATE INDEX idx_media_posts_source ON media_posts (source);
CREATE INDEX idx_media_posts_external_id ON media_posts (external_id);
CREATE INDEX idx_media_posts_created_at ON media_posts (created_at);
CREATE INDEX idx_media_posts_survey_id ON media_posts (survey_id);
CREATE INDEX idx_media_posts_article_id ON media_posts (article_id);
CREATE INDEX idx_consulting_services_active ON consulting_services (is_active);
CREATE INDEX idx_consulting_requests_service ON consulting_requests (service_id);
CREATE INDEX idx_consulting_requests_status ON consulting_requests (status);
CREATE INDEX idx_consulting_requests_priority ON consulting_requests (priority);
CREATE INDEX idx_consulting_requests_assigned_to ON consulting_requests (assigned_to);
CREATE INDEX idx_consulting_requests_created ON consulting_requests (created_at);
CREATE INDEX idx_consulting_events_service_id ON consulting_events (service_id);
CREATE INDEX idx_consulting_events_event_type ON consulting_events (event_type);
CREATE INDEX idx_consulting_events_created_at ON consulting_events (created_at);
CREATE INDEX idx_consulting_events_service_event_created ON consulting_events (service_id, event_type, created_at);
CREATE INDEX idx_platform_events_event_type ON platform_events (event_type);
CREATE INDEX idx_platform_events_entity_type ON platform_events (entity_type);
CREATE INDEX idx_platform_events_entity_id ON platform_events (entity_id);
CREATE INDEX idx_platform_events_session_id ON platform_events (session_id(191));
CREATE INDEX idx_platform_events_created_at ON platform_events (created_at);
CREATE INDEX idx_platform_events_entity_event_created ON platform_events (entity_type, event_type, created_at);
CREATE INDEX idx_training_videos_active_order ON training_videos (is_active, display_order, id);
CREATE INDEX idx_training_videos_created_at ON training_videos (created_at);
CREATE INDEX idx_training_playlists_category ON training_playlists (category_id, is_active, display_order, id);
CREATE INDEX idx_playlists_active_order ON training_playlists (is_active, display_order, id);
CREATE INDEX idx_playlist_items_playlist ON playlist_items (playlist_id, order_index);
CREATE INDEX idx_training_notes_category ON training_notes (category_id, is_active, display_order, id);
CREATE INDEX idx_survey_conditional_rules_survey_id ON survey_conditional_rules (survey_id);
CREATE INDEX idx_survey_drafts_user_id ON survey_drafts (user_id);
CREATE INDEX idx_survey_drafts_survey_id ON survey_drafts (survey_id);
CREATE INDEX idx_article_drafts_user_id ON article_drafts (user_id);
CREATE INDEX idx_article_drafts_article_id ON article_drafts (article_id);
