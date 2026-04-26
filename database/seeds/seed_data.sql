-- Seed data for initial setup
-- NOTE: Only Manoj Kumar (user 1) is admin - he is the ONLY one who can create surveys and publish articles
-- Insert diverse users with comprehensive profile data
-- Admin password: manoj123 (row 1 hash)
-- Default user password: admin123 (remaining rows hash)
INSERT INTO users (name, email, password_hash, role, location, age, gender, phone, bio) VALUES
('Manoj Kumar', 'manojkumar@jnu.ac.in', '$2a$10$LVtW6aDEwsV3Flu9c1tLCuw7CkHoQrP5KcnzqRrs3913Iml1xs9iG', 'admin', 'New Delhi, India', 39, 'Male', '+1-555-0101', 'Assistant Professor specializing in biostatistics, health economics, and applied data analysis.'),
('Marcus Johnson', 'user02@example.test', '$2a$10$S9cRWL3rZ6MrvmE1FmXb2eGv1EDjEMJ86aAtHaGVaF98OJ0pcXCSq', 'user', 'Chicago, IL', 45, 'Male', '+1-555-0102', 'Healthcare administrator interested in patient satisfaction surveys.'),
('Priya Patel', 'user03@example.test', '$2a$10$S9cRWL3rZ6MrvmE1FmXb2eGv1EDjEMJ86aAtHaGVaF98OJ0pcXCSq', 'user', 'Austin, TX', 28, 'Female', '+1-555-0103', 'UX researcher exploring new survey methodologies.'),
('Ahmed Al-Rashid', 'user04@example.test', '$2a$10$S9cRWL3rZ6MrvmE1FmXb2eGv1EDjEMJ86aAtHaGVaF98OJ0pcXCSq', 'user', 'Dubai, UAE', 38, 'Male', '+1-555-0104', 'Business consultant specializing in customer feedback analysis.'),
('Emily Rodriguez', 'user05@example.test', '$2a$10$S9cRWL3rZ6MrvmE1FmXb2eGv1EDjEMJ86aAtHaGVaF98OJ0pcXCSq', 'user', 'Boston, MA', 26, 'Female', '+1-555-0105', 'PhD candidate researching social survey methods and engagement.'),
('Yuki Tanaka', 'user06@example.test', '$2a$10$S9cRWL3rZ6MrvmE1FmXb2eGv1EDjEMJ86aAtHaGVaF98OJ0pcXCSq', 'user', 'Tokyo, Japan', 41, 'Non-binary', '+1-555-0106', 'Market research director with 15+ years experience in consumer insights.'),
('David Okonkwo', 'user07@example.test', '$2a$10$S9cRWL3rZ6MrvmE1FmXb2eGv1EDjEMJ86aAtHaGVaF98OJ0pcXCSq', 'user', 'Lagos, Nigeria', 29, 'Male', '+1-555-0107', 'Startup founder building community engagement platforms.'),
('Sofia Andersson', 'user08@example.test', '$2a$10$S9cRWL3rZ6MrvmE1FmXb2eGv1EDjEMJ86aAtHaGVaF98OJ0pcXCSq', 'user', 'Stockholm, Sweden', 34, 'Female', '+1-555-0108', 'Design strategist focused on user feedback loops.'),
('James Williams', 'user09@example.test', '$2a$10$S9cRWL3rZ6MrvmE1FmXb2eGv1EDjEMJ86aAtHaGVaF98OJ0pcXCSq', 'user', 'London, UK', 52, 'Male', '+1-555-0109', 'Retail operations manager using surveys for store performance tracking.'),
('Isabella Costa', 'user10@example.test', '$2a$10$S9cRWL3rZ6MrvmE1FmXb2eGv1EDjEMJ86aAtHaGVaF98OJ0pcXCSq', 'user', 'São Paulo, Brazil', 31, 'Female', '+1-555-0110', 'Non-profit coordinator measuring community impact through surveys.'),
('Liam O''Connor', 'user11@example.test', '$2a$10$S9cRWL3rZ6MrvmE1FmXb2eGv1EDjEMJ86aAtHaGVaF98OJ0pcXCSq', 'user', 'Dublin, Ireland', 37, 'Male', '+1-555-0111', 'Marketing agency director specializing in brand perception studies.'),
('Mei Zhang', 'user12@example.test', '$2a$10$S9cRWL3rZ6MrvmE1FmXb2eGv1EDjEMJ86aAtHaGVaF98OJ0pcXCSq', 'user', 'Shanghai, China', 43, 'Female', '+1-555-0112', 'Financial analyst conducting employee satisfaction surveys.'),
('Alex Thompson', 'user13@example.test', '$2a$10$S9cRWL3rZ6MrvmE1FmXb2eGv1EDjEMJ86aAtHaGVaF98OJ0pcXCSq', 'user', 'Toronto, Canada', 24, 'Non-binary', '+1-555-0113', 'Junior analyst learning survey design and data visualization.'),
('Fatima Hassan', 'user14@example.test', '$2a$10$S9cRWL3rZ6MrvmE1FmXb2eGv1EDjEMJ86aAtHaGVaF98OJ0pcXCSq', 'user', 'Doha, Qatar', 36, 'Female', '+1-555-0114', 'Survey researcher studying cross-cultural response patterns.'),
('Oliver Schmidt', 'user15@example.test', '$2a$10$S9cRWL3rZ6MrvmE1FmXb2eGv1EDjEMJ86aAtHaGVaF98OJ0pcXCSq', 'user', 'Munich, Germany', 48, 'Male', '+1-555-0115', 'Quality control manager using surveys for process improvement.')
ON CONFLICT (email) DO NOTHING;

-- Insert diverse surveys
-- NOTE: All surveys created by admin (Manoj Kumar - user 1) ONLY
INSERT INTO surveys (title, description, created_by, status) VALUES
('Customer Satisfaction Survey', 'Help us improve our services by sharing your feedback', 1, 'published'),
('Employee Engagement Survey 2026', 'Annual survey to measure workplace satisfaction and engagement', 1, 'published'),
('Healthcare Patient Experience', 'Help us understand your healthcare journey and improve patient care', 1, 'published'),
('Product Usability Feedback', 'Share your experience with our new product features', 1, 'published'),
('Online Learning Program Evaluation', 'Evaluate your experience with our educational programs', 1, 'published'),
('Conference Attendee Feedback', 'Tell us about your conference experience', 1, 'published'),
('Retail Shopping Experience', 'Help us improve your in-store and online shopping experience', 1, 'published'),
('Community Impact Assessment', 'Assess the impact of our community programs', 1, 'draft')
ON CONFLICT DO NOTHING;

-- Insert questions for Survey 1: Customer Satisfaction
INSERT INTO questions (survey_id, question_text, question_type, is_required, order_index) VALUES
(1, 'How satisfied are you with our service?', 'rating', true, 1),
(1, 'What are your main concerns?', 'text', false, 2),
(1, 'Which features do you use most?', 'multiple_choice', true, 3),
(1, 'Which aspects need improvement?', 'checkbox', false, 4),
-- Survey 2: Employee Engagement
(2, 'How would you rate your overall job satisfaction?', 'rating', true, 1),
(2, 'Do you feel valued at work?', 'multiple_choice', true, 2),
(2, 'What motivates you most in your role?', 'text', false, 3),
(2, 'Which benefits are most important to you?', 'checkbox', true, 4),
(2, 'How likely are you to recommend this workplace?', 'rating', true, 5),
-- Survey 3: Healthcare Patient Experience
(3, 'How would you rate the quality of care received?', 'rating', true, 1),
(3, 'How long did you wait for your appointment?', 'multiple_choice', true, 2),
(3, 'Which services did you use?', 'checkbox', true, 3),
(3, 'Please describe your experience with our staff', 'text', false, 4),
(3, 'Would you recommend our facility?', 'multiple_choice', true, 5),
-- Survey 4: Product Usability
(4, 'How easy was it to use our product?', 'rating', true, 1),
(4, 'Which features did you find most useful?', 'checkbox', true, 2),
(4, 'What improvements would you suggest?', 'text', false, 3),
(4, 'How often do you use the product?', 'multiple_choice', true, 4),
-- Survey 5: Online Learning
(5, 'Rate the quality of course content', 'rating', true, 1),
(5, 'Rate the instructor effectiveness', 'rating', true, 2),
(5, 'Which learning format do you prefer?', 'multiple_choice', true, 3),
(5, 'What topics would you like to see covered?', 'text', false, 4),
(5, 'Which aspects enhanced your learning?', 'checkbox', false, 5),
-- Survey 6: Conference Feedback
(6, 'Overall conference rating', 'rating', true, 1),
(6, 'Which sessions did you attend?', 'checkbox', true, 2),
(6, 'What was the highlight of the conference?', 'text', false, 3),
(6, 'How was the venue?', 'multiple_choice', true, 4),
-- Survey 7: Retail Shopping
(7, 'Rate your shopping experience', 'rating', true, 1),
(7, 'How did you shop with us?', 'multiple_choice', true, 2),
(7, 'Which departments did you visit?', 'checkbox', false, 3),
(7, 'Any suggestions for improvement?', 'text', false, 4),
(7, 'How likely are you to return?', 'rating', true, 5)
ON CONFLICT DO NOTHING;

-- Insert options for all multiple choice and checkbox questions
INSERT INTO options (question_id, option_text, order_index) VALUES
-- Q3: Survey 1 - Features
(3, 'Dashboard Analytics', 1),
(3, 'Report Generation', 2),
(3, 'Data Export', 3),
(3, 'Team Collaboration', 4),
-- Q4: Survey 1 - Improvements (checkbox)
(4, 'User Interface', 1),
(4, 'Performance Speed', 2),
(4, 'Documentation', 3),
(4, 'Customer Support', 4),
(4, 'Mobile App', 5),
-- Q6: Survey 2 - Feel Valued
(6, 'Strongly Agree', 1),
(6, 'Agree', 2),
(6, 'Neutral', 3),
(6, 'Disagree', 4),
(6, 'Strongly Disagree', 5),
-- Q8: Survey 2 - Benefits (checkbox)
(8, 'Health Insurance', 1),
(8, 'Flexible Hours', 2),
(8, 'Remote Work', 3),
(8, 'Professional Development', 4),
(8, 'Paid Time Off', 5),
-- Q11: Survey 3 - Wait Time
(11, 'Less than 15 minutes', 1),
(11, '15-30 minutes', 2),
(11, '30-60 minutes', 3),
(11, 'More than 1 hour', 4),
-- Q12: Survey 3 - Services (checkbox)
(12, 'Primary Care', 1),
(12, 'Specialist Consultation', 2),
(12, 'Diagnostic Testing', 3),
(12, 'Emergency Care', 4),
(12, 'Pharmacy', 5),
-- Q13: Survey 3 - Recommend
(13, 'Definitely Yes', 1),
(13, 'Probably Yes', 2),
(13, 'Not Sure', 3),
(13, 'Probably No', 4),
(13, 'Definitely No', 5),
-- Q15: Survey 4 - Features (checkbox)
(15, 'Quick Search', 1),
(15, 'Advanced Filters', 2),
(15, 'Export Options', 3),
(15, 'Customizable Dashboard', 4),
(15, 'Mobile Access', 5),
-- Q17: Survey 4 - Usage Frequency
(17, 'Daily', 1),
(17, 'Several times a week', 2),
(17, 'Weekly', 3),
(17, 'Monthly', 4),
(17, 'Rarely', 5),
-- Q20: Survey 5 - Learning Format
(20, 'Live Virtual Sessions', 1),
(20, 'Pre-recorded Videos', 2),
(20, 'Interactive Workshops', 3),
(20, 'Self-paced Modules', 4),
(20, 'Hybrid Approach', 5),
-- Q22: Survey 5 - Learning Enhancements (checkbox)
(22, 'Visual Aids', 1),
(22, 'Hands-on Exercises', 2),
(22, 'Group Discussions', 3),
(22, 'Real-world Examples', 4),
(22, 'Quizzes and Assessments', 5),
-- Q24: Survey 6 - Sessions (checkbox)
(24, 'Keynote Presentations', 1),
(24, 'Technical Workshops', 2),
(24, 'Panel Discussions', 3),
(24, 'Networking Events', 4),
(24, 'Product Demos', 5),
-- Q26: Survey 6 - Venue
(26, 'Excellent', 1),
(26, 'Good', 2),
(26, 'Average', 3),
(26, 'Below Average', 4),
(26, 'Poor', 5),
-- Q28: Survey 7 - Shopping Method
(28, 'In-store only', 1),
(28, 'Online only', 2),
(28, 'Both in-store and online', 3),
(28, 'Mobile app', 4),
-- Q29: Survey 7 - Departments (checkbox)
(29, 'Electronics', 1),
(29, 'Clothing', 2),
(29, 'Home & Garden', 3),
(29, 'Sports & Outdoors', 4),
(29, 'Food & Beverages', 5)
ON CONFLICT DO NOTHING;

-- Insert diverse responses from users across surveys
INSERT INTO responses (survey_id, user_id, submitted_at) VALUES
-- Survey 1: Customer Satisfaction (8 responses)
(1, 2, '2026-03-01 10:30:00'),
(1, 3, '2026-03-01 14:22:00'),
(1, 5, '2026-03-02 09:15:00'),
(1, 7, '2026-03-02 16:45:00'),
(1, 11, '2026-03-03 11:20:00'),
(1, 12, '2026-03-04 13:10:00'),
(1, 14, '2026-03-05 10:05:00'),
(1, 15, '2026-03-06 15:30:00'),
-- Survey 2: Employee Engagement (10 responses)
(2, 1, '2026-02-15 09:00:00'),
(2, 3, '2026-02-15 10:30:00'),
(2, 4, '2026-02-16 14:20:00'),
(2, 5, '2026-02-16 16:45:00'),
(2, 7, '2026-02-17 11:15:00'),
(2, 9, '2026-02-18 09:30:00'),
(2, 11, '2026-02-18 13:40:00'),
(2, 12, '2026-02-19 10:10:00'),
(2, 13, '2026-02-20 15:25:00'),
(2, 15, '2026-02-21 14:50:00'),
-- Survey 3: Healthcare (6 responses)
(3, 1, '2026-02-10 11:30:00'),
(3, 5, '2026-02-11 09:20:00'),
(3, 8, '2026-02-12 14:15:00'),
(3, 10, '2026-02-13 10:45:00'),
(3, 13, '2026-02-14 16:30:00'),
(3, 14, '2026-02-15 13:20:00'),
-- Survey 4: Product Usability (9 responses)
(4, 1, '2026-03-01 10:00:00'),
(4, 2, '2026-03-01 11:30:00'),
(4, 4, '2026-03-02 09:45:00'),
(4, 6, '2026-03-02 14:20:00'),
(4, 7, '2026-03-03 10:30:00'),
(4, 8, '2026-03-03 15:15:00'),
(4, 11, '2026-03-04 11:00:00'),
(4, 13, '2026-03-05 09:30:00'),
(4, 14, '2026-03-06 14:45:00'),
-- Survey 5: Online Learning (7 responses)
(5, 2, '2026-02-20 10:15:00'),
(5, 3, '2026-02-21 14:30:00'),
(5, 6, '2026-02-22 11:00:00'),
(5, 9, '2026-02-23 15:45:00'),
(5, 10, '2026-02-24 09:20:00'),
(5, 12, '2026-02-25 13:10:00'),
(5, 13, '2026-02-26 10:40:00'),
-- Survey 6: Conference (5 responses)
(6, 1, '2026-02-28 16:00:00'),
(6, 3, '2026-02-28 16:30:00'),
(6, 4, '2026-02-28 17:15:00'),
(6, 6, '2026-02-28 18:00:00'),
(6, 11, '2026-02-28 18:45:00'),
-- Survey 7: Retail Shopping (8 responses)
(7, 2, '2026-03-05 12:00:00'),
(7, 5, '2026-03-05 14:30:00'),
(7, 6, '2026-03-06 10:15:00'),
(7, 8, '2026-03-06 15:20:00'),
(7, 10, '2026-03-07 11:30:00'),
(7, 12, '2026-03-07 13:45:00'),
(7, 14, '2026-03-08 10:00:00'),
(7, 15, '2026-03-08 16:30:00')
ON CONFLICT DO NOTHING;

-- Insert answers for all responses
INSERT INTO answers (response_id, question_id, answer_text, option_id) VALUES
-- Response 1: User 2, Survey 1
(1, 1, '4', NULL), -- Rating: 4
(1, 2, 'Need better mobile app support and faster response times', NULL),
(1, 3, NULL, 1), -- Dashboard Analytics
-- Response 2: User 3, Survey 1
(2, 1, '5', NULL), -- Rating: 5
(2, 2, 'Everything is great! Very intuitive interface', NULL),
(2, 3, NULL, 2), -- Report Generation
-- Response 3: User 5, Survey 1
(3, 1, '4', NULL),
(3, 2, 'Would like more customization options', NULL),
(3, 3, NULL, 3), -- Data Export
-- Response 4: User 7, Survey 1
(4, 1, '5', NULL),
(4, 2, 'Excellent product, meets all our needs', NULL),
(4, 3, NULL, 4), -- Team Collaboration
-- Response 5: User 11, Survey 1
(5, 1, '3', NULL),
(5, 2, 'User interface could be more modern', NULL),
(5, 3, NULL, 1),
-- Response 6: User 12, Survey 1
(6, 1, '4', NULL),
(6, 2, 'Good overall but pricing could be better', NULL),
(6, 3, NULL, 2),
-- Response 7: User 14, Survey 1
(7, 1, '5', NULL),
(7, 2, 'Perfect for our cross-cultural research needs', NULL),
(7, 3, NULL, 1),
-- Response 8: User 15, Survey 1
(8, 1, '4', NULL),
(8, 2, 'Works well for quality control processes', NULL),
(8, 3, NULL, 3),

-- Survey 2 Responses: Employee Engagement
-- Response 9: User 1, Survey 2
(9, 5, '5', NULL), -- Job satisfaction rating
(9, 6, NULL, 2), -- Agree feeling valued
(9, 7, 'Working with a great team and making impact', NULL),
(9, 8, NULL, 1), -- Health Insurance
(9, 8, NULL, 4), -- Professional Development
(9, 9, '5', NULL), -- Recommend rating
-- Response 10: User 3, Survey 2
(10, 5, '4', NULL),
(10, 6, NULL, 2), -- Agree
(10, 7, 'Flexible work environment and interesting projects', NULL),
(10, 8, NULL, 2), -- Flexible Hours
(10, 8, NULL, 3), -- Remote Work
(10, 9, '4', NULL),
-- Response 11: User 4, Survey 2
(11, 5, '4', NULL),
(11, 6, NULL, 1), -- Strongly Agree
(11, 7, 'Career growth opportunities and competitive compensation', NULL),
(11, 8, NULL, 1),
(11, 8, NULL, 4),
(11, 8, NULL, 5), -- PTO
(11, 9, '5', NULL),
-- Response 12: User 5, Survey 2
(12, 5, '3', NULL),
(12, 6, NULL, 3), -- Neutral
(12, 7, 'Research opportunities but need better work-life balance', NULL),
(12, 8, NULL, 2),
(12, 8, NULL, 4),
(12, 9, '3', NULL),
-- Response 13: User 7, Survey 2
(13, 5, '5', NULL),
(13, 6, NULL, 1), -- Strongly Agree
(13, 7, 'Innovative environment and supportive leadership', NULL),
(13, 8, NULL, 2),
(13, 8, NULL, 3),
(13, 8, NULL, 4),
(13, 9, '5', NULL),
-- Response 14: User 9, Survey 2
(14, 5, '4', NULL),
(14, 6, NULL, 2), -- Agree
(14, 7, 'Good team dynamics and clear communication', NULL),
(14, 8, NULL, 1),
(14, 8, NULL, 5),
(14, 9, '4', NULL),
-- Response 15: User 11, Survey 2
(15, 5, '4', NULL),
(15, 6, NULL, 2),
(15, 7, 'Creative projects and diverse client base', NULL),
(15, 8, NULL, 2),
(15, 8, NULL, 3),
(15, 9, '4', NULL),
-- Response 16: User 12, Survey 2
(16, 5, '3', NULL),
(16, 6, NULL, 3), -- Neutral
(16, 7, 'Stable position but limited growth opportunities', NULL),
(16, 8, NULL, 1),
(16, 8, NULL, 5),
(16, 9, '3', NULL),
-- Response 17: User 13, Survey 2
(17, 5, '5', NULL),
(17, 6, NULL, 1),
(17, 7, 'Learning so much and great mentorship', NULL),
(17, 8, NULL, 2),
(17, 8, NULL, 4),
(17, 9, '5', NULL),
-- Response 18: User 15, Survey 2
(18, 5, '4', NULL),
(18, 6, NULL, 2),
(18, 7, 'Strong company culture and quality focus', NULL),
(18, 8, NULL, 1),
(18, 8, NULL, 4),
(18, 9, '4', NULL),

-- Survey 3 Responses: Healthcare
-- Response 19: User 1, Survey 3
(19, 10, '5', NULL), -- Quality rating
(19, 11, NULL, 1), -- < 15 min wait
(19, 12, NULL, 1), -- Primary Care
(19, 12, NULL, 3), -- Diagnostic Testing
(19, 13, 'Professional staff and clean facilities', NULL),
(19, 14, NULL, 1), -- Definitely Yes
-- Response 20: User 5, Survey 3
(20, 10, '4', NULL),
(20, 11, NULL, 2), -- 15-30 min
(20, 12, NULL, 2), -- Specialist
(20, 13, 'Good care but appointment scheduling could be easier', NULL),
(20, 14, NULL, 2), -- Probably Yes
-- Response 21: User 8, Survey 3
(21, 10, '5', NULL),
(21, 11, NULL, 1),
(21, 12, NULL, 1),
(21, 12, NULL, 5), -- Pharmacy
(21, 13, 'Excellent patient-centered care', NULL),
(21, 14, NULL, 1),
-- Response 22: User 10, Survey 3
(22, 10, '4', NULL),
(22, 11, NULL, 3), -- 30-60 min
(22, 12, NULL, 1),
(22, 12, NULL, 2),
(22, 13, 'Wait time was long but care quality was good', NULL),
(22, 14, NULL, 2),
-- Response 23: User 13, Survey 3
(23, 10, '5', NULL),
(23, 11, NULL, 1),
(23, 12, NULL, 3),
(23, 13, 'Very satisfied with the entire experience', NULL),
(23, 14, NULL, 1),
-- Response 24: User 14, Survey 3
(24, 10, '4', NULL),
(24, 11, NULL, 2),
(24, 12, NULL, 1),
(24, 12, NULL, 2),
(24, 12, NULL, 3),
(24, 13, 'Comprehensive care with multilingual support', NULL),
(24, 14, NULL, 1),

-- Survey 4 Responses: Product Usability
-- Response 25: User 1, Survey 4
(25, 14, '5', NULL), -- Ease of use
(25, 15, NULL, 1), -- Quick Search
(25, 15, NULL, 4), -- Customizable Dashboard
(25, 16, 'Maybe add more integration options', NULL),
(25, 17, NULL, 1), -- Daily
-- Response 26: User 2, Survey 4
(26, 14, '4', NULL),
(26, 15, NULL, 2), -- Advanced Filters
(26, 15, NULL, 3), -- Export Options
(26, 16, 'Add bulk operations for healthcare data management', NULL),
(26, 17, NULL, 2), -- Several times a week
-- Response 27: User 4, Survey 4
(27, 14, '5', NULL),
(27, 15, NULL, 1),
(27, 15, NULL, 2),
(27, 15, NULL, 5), -- Mobile Access
(27, 16, 'Perfect for our consulting needs', NULL),
(27, 17, NULL, 1),
-- Response 28: User 6, Survey 4
(28, 14, '5', NULL),
(28, 15, NULL, 1),
(28, 15, NULL, 2),
(28, 15, NULL, 4),
(28, 16, 'Excellent tool for market research analysis', NULL),
(28, 17, NULL, 1),
-- Response 29: User 7, Survey 4
(29, 14, '4', NULL),
(29, 15, NULL, 4),
(29, 15, NULL, 5),
(29, 16, 'Would like better collaboration features', NULL),
(29, 17, NULL, 2),
-- Response 30: User 8, Survey 4
(30, 14, '5', NULL),
(30, 15, NULL, 1),
(30, 15, NULL, 4),
(30, 16, 'Great for design workflow integration', NULL),
(30, 17, NULL, 1),
-- Response 31: User 11, Survey 4
(31, 14, '4', NULL),
(31, 15, NULL, 2),
(31, 15, NULL, 3),
(31, 16, 'Add more visualization options for client presentations', NULL),
(31, 17, NULL, 2),
-- Response 32: User 13, Survey 4
(32, 14, '4', NULL),
(32, 15, NULL, 1),
(32, 15, NULL, 5),
(32, 16, 'More tutorials would help new users', NULL),
(32, 17, NULL, 3), -- Weekly
-- Response 33: User 14, Survey 4
(33, 14, '5', NULL),
(33, 15, NULL, 1),
(33, 15, NULL, 2),
(33, 15, NULL, 3),
(33, 16, 'Excellent for cross-cultural data analysis', NULL),
(33, 17, NULL, 1),

-- Survey 5 Responses: Online Learning
-- Response 34: User 2, Survey 5
(34, 18, '4', NULL), -- Content quality
(34, 19, '5', NULL), -- Instructor rating
(34, 20, NULL, 3), -- Interactive Workshops
(34, 21, 'More case studies in healthcare management', NULL),
-- Response 35: User 3, Survey 5
(35, 18, '5', NULL),
(35, 19, '5', NULL),
(35, 20, NULL, 5), -- Hybrid
(35, 21, 'Advanced UX research methodologies', NULL),
(35, 22, NULL, 2), -- Hands-on Exercises
(35, 22, NULL, 4), -- Real-world Examples
-- Response 36: User 6, Survey 5
(36, 18, '5', NULL),
(36, 19, '4', NULL),
(36, 20, NULL, 1), -- Live Virtual
(36, 21, 'Consumer behavior analysis and data interpretation', NULL),
(36, 22, NULL, 1), -- Visual Aids
(36, 22, NULL, 3), -- Group Discussions
(36, 22, NULL, 4),
-- Response 37: User 9, Survey 5
(37, 18, '4', NULL),
(37, 19, '4', NULL),
(37, 20, NULL, 4), -- Self-paced
(37, 21, 'Retail trends and customer experience strategies', NULL),
(37, 22, NULL, 2),
(37, 22, NULL, 4),
-- Response 38: User 10, Survey 5
(38, 18, '5', NULL),
(38, 19, '5', NULL),
(38, 20, NULL, 3),
(38, 21, 'Community development and impact measurement', NULL),
(38, 22, NULL, 2),
(38, 22, NULL, 3),
(38, 22, NULL, 4),
-- Response 39: User 12, Survey 5
(39, 18, '4', NULL),
(39, 19, '3', NULL),
(39, 20, NULL, 2), -- Pre-recorded
(39, 21, 'Financial modeling and forecasting techniques', NULL),
(39, 22, NULL, 1),
(39, 22, NULL, 5), -- Quizzes
-- Response 40: User 13, Survey 5
(40, 18, '5', NULL),
(40, 19, '5', NULL),
(40, 20, NULL, 1),
(40, 21, 'Data visualization and statistical analysis', NULL),
(40, 22, NULL, 1),
(40, 22, NULL, 2),
(40, 22, NULL, 5),

-- Survey 6 Responses: Conference
-- Response 41: User 1, Survey 6
(41, 23, '5', NULL), -- Overall rating
(41, 24, NULL, 1), -- Keynote
(41, 24, NULL, 4), -- Networking
(41, 25, 'Excellent networking opportunities and inspiring speakers', NULL),
(41, 26, NULL, 1), -- Excellent venue
-- Response 42: User 3, Survey 6
(42, 23, '5', NULL),
(42, 24, NULL, 2), -- Technical Workshops
(42, 24, NULL, 5), -- Product Demos
(42, 25, 'Great hands-on workshops on new UX tools', NULL),
(42, 26, NULL, 2), -- Good
-- Response 43: User 4, Survey 6
(43, 23, '4', NULL),
(43, 24, NULL, 1),
(43, 24, NULL, 3), -- Panel Discussions
(43, 25, 'Valuable insights on consulting trends', NULL),
(43, 26, NULL, 2),
-- Response 44: User 6, Survey 6
(44, 23, '5', NULL),
(44, 24, NULL, 1),
(44, 24, NULL, 2),
(44, 24, NULL, 3),
(44, 25, 'Outstanding keynote on market research innovations', NULL),
(44, 26, NULL, 1),
-- Response 45: User 11, Survey 6
(45, 23, '4', NULL),
(45, 24, NULL, 3),
(45, 24, NULL, 4),
(45, 25, 'Good for professional connections', NULL),
(45, 26, NULL, 2),

-- Survey 7 Responses: Retail Shopping
-- Response 46: User 2, Survey 7
(46, 27, '4', NULL), -- Shopping experience
(46, 28, NULL, 3), -- Both in-store and online
(46, 29, NULL, 5), -- Food & Beverages
(46, 30, 'More parking spaces needed', NULL),
(46, 31, '4', NULL), -- Likely to return
-- Response 47: User 5, Survey 7
(47, 27, '5', NULL),
(47, 28, NULL, 2), -- Online only
(47, 29, NULL, 2), -- Clothing
(47, 30, 'Fast delivery and good return policy', NULL),
(47, 31, '5', NULL),
-- Response 48: User 6, Survey 7
(48, 27, '4', NULL),
(48, 28, NULL, 1), -- In-store only
(48, 29, NULL, 1), -- Electronics
(48, 29, NULL, 3), -- Home & Garden
(48, 30, 'Knowledgeable staff in electronics section', NULL),
(48, 31, '4', NULL),
-- Response 49: User 8, Survey 7
(49, 27, '5', NULL),
(49, 28, NULL, 4), -- Mobile app
(49, 29, NULL, 3),
(49, 30, 'Love the mobile app interface', NULL),
(49, 31, '5', NULL),
-- Response 50: User 10, Survey 7
(50, 27, '4', NULL),
(50, 28, NULL, 3),
(50, 29, NULL, 5),
(50, 30, 'More eco-friendly product options would be great', NULL),
(50, 31, '4', NULL),
-- Response 51: User 12, Survey 7
(51, 27, '3', NULL),
(51, 28, NULL, 2),
(51, 29, NULL, 1),
(51, 30, 'Website navigation could be improved', NULL),
(51, 31, '3', NULL),
-- Response 52: User 14, Survey 7
(52, 27, '5', NULL),
(52, 28, NULL, 3),
(52, 29, NULL, 1),
(52, 29, NULL, 4), -- Sports
(52, 30, 'Great variety and competitive prices', NULL),
(52, 31, '5', NULL),
-- Response 53: User 15, Survey 7
(53, 27, '4', NULL),
(53, 28, NULL, 1),
(53, 29, NULL, 3),
(53, 29, NULL, 4),
(53, 30, 'Quality products with good warranty', NULL),
(53, 31, '4', NULL)
ON CONFLICT DO NOTHING;

-- Insert rich, interactive articles
-- NOTE: All articles authored by admin (Sarah Chen - user 1) ONLY with formatting and images
INSERT INTO articles (title, content, author, is_published) VALUES
('Mastering Rating Scale Analysis: From Data to Insights', 
'<div class="article-content">
<img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200" alt="Data Analytics Dashboard" class="article-hero-image" />

<h2>Understanding the Power of Rating Scales</h2>
<p>Rating scales are the <strong>backbone of quantitative survey research</strong>, providing numerical data that can be easily analyzed and compared. In this comprehensive guide, we''ll explore how to extract maximum value from your rating scale questions.</p>

<h3>Types of Rating Scales</h3>
<ul>
<li><strong>Likert Scales:</strong> Measure agreement levels (Strongly Agree to Strongly Disagree)</li>
<li><strong>Numeric Scales:</strong> Simple 1-10 or 1-5 ratings</li>
<li><strong>Semantic Differential:</strong> Opposite adjectives at each end</li>
<li><strong>Frequency Scales:</strong> Always, Often, Sometimes, Rarely, Never</li>
</ul>

<img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000" alt="Rating Scale Examples" class="article-inline-image" />

<h3>Key Metrics to Calculate</h3>
<table>
<tr><th>Metric</th><th>Purpose</th><th>Calculation</th></tr>
<tr><td>Mean Score</td><td>Average rating</td><td>Sum of all ratings ÷ total responses</td></tr>
<tr><td>Median</td><td>Middle value</td><td>50th percentile</td></tr>
<tr><td>Standard Deviation</td><td>Response spread</td><td>Measure of variance</td></tr>
<tr><td>Net Promoter Score</td><td>Customer loyalty</td><td>% Promoters - % Detractors</td></tr>
</table>

<blockquote>
"A mean score of 4.2 is meaningless without context. Compare it to previous periods, benchmarks, or segment breakdowns to unlock real insights." - Sarah Chen, Lead Product Manager
</blockquote>

<h3>Segmentation Strategies</h3>
<p>Break down your rating data by:</p>
<ol>
<li><strong>Demographics:</strong> Age, gender, location</li>
<li><strong>Behavioral patterns:</strong> Usage frequency, tenure</li>
<li><strong>Response patterns:</strong> High vs. low raters</li>
</ol>

<img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800" alt="Data Segmentation" class="article-inline-image" />

<h3>Common Pitfalls to Avoid</h3>
<p>⚠️ <em>Watch out for these issues:</em></p>
<ul>
<li>Response bias toward middle or extreme values</li>
<li>Cultural differences in scale interpretation</li>
<li>Survey fatigue affecting later questions</li>
<li>Insufficient sample size for reliable conclusions</li>
</ul>

<p class="conclusion"><strong>Ready to dive deeper?</strong> Start analyzing your rating data with these techniques and watch your insights multiply!</p>
</div>', 1, true),

('The Art of Analyzing Open-Ended Responses', 
'<div class="article-content">
<img src="https://images.unsplash.com/photo-1455849318743-b2233052fcff?w=1200" alt="Person Writing Feedback" class="article-hero-image" />

<h2>Unlocking the Gold Mine of Qualitative Data</h2>
<p>While rating scales give you the <em>what</em>, open-ended questions reveal the <strong>why</strong>. Text responses contain rich insights that numbers alone cannot capture. Let''s explore proven techniques for extracting value from qualitative feedback.</p>

<h3>Why Open-Ended Questions Matter</h3>
<img src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1000" alt="Survey Questionnaire" class="article-inline-image" />

<p>Consider this example from our recent healthcare survey:</p>
<blockquote>
"Wait time was long but care quality was good" - Anonymous Patient
</blockquote>
<p>This single response reveals a nuanced perspective that a rating alone would miss: satisfaction despite frustration.</p>

<h3>Thematic Analysis: A Step-by-Step Guide</h3>
<ol>
<li><strong>Initial Reading:</strong> Familiarize yourself with all responses</li>
<li><strong>Code Development:</strong> Identify recurring themes and patterns</li>
<li><strong>Categorization:</strong> Group similar responses together</li>
<li><strong>Quantification:</strong> Count frequency of each theme</li>
<li><strong>Integration:</strong> Connect themes to quantitative data</li>
</ol>

<h3>Common Themes in Survey Responses</h3>
<table>
<tr><th>Category</th><th>Example Phrases</th><th>Frequency</th></tr>
<tr><td>Speed/Performance</td><td>"too slow", "fast", "responsive"</td><td>32%</td></tr>
<tr><td>Ease of Use</td><td>"intuitive", "confusing", "simple"</td><td>28%</td></tr>
<tr><td>Features/Functionality</td><td>"missing feature", "powerful tools"</td><td>25%</td></tr>
<tr><td>Support/Service</td><td>"helpful staff", "no response"</td><td>15%</td></tr>
</table>

<img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900" alt="Text Analysis Visualization" class="article-inline-image" />

<h3>Sentiment Analysis Basics</h3>
<p>Classify responses into three categories:</p>
<ul>
<li>😊 <strong>Positive:</strong> Praise, satisfaction, approval</li>
<li>😐 <strong>Neutral:</strong> Suggestions, observations, questions</li>
<li>😞 <strong>Negative:</strong> Complaints, frustration, criticism</li>
</ul>

<h3>Pro Tips from the Experts</h3>
<blockquote>
"Don''t just read responses—truly listen. The most valuable insights often appear in unexpected places." - Yuki Tanaka, Market Research Director
</blockquote>

<p><strong>Action Items:</strong></p>
<ul>
<li>✓ Use word clouds to visualize common terms</li>
<li>✓ Quote verbatim in reports for authenticity</li>
<li>✓ Track themes over time to spot trends</li>
<li>✓ Cross-reference with rating scores</li>
</ul>

<img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800" alt="Data Review Meeting" class="article-inline-image" />
</div>', 1, true),

('Cross-Cultural Survey Design: A Global Perspective', 
'<div class="article-content">
<img src="https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1200" alt="Global Map" class="article-hero-image" />

<h2>Designing Surveys for a Global Audience</h2>
<p>In our interconnected world, surveys often cross cultural boundaries. What works in San Francisco might fail in Shanghai. This guide explores the critical considerations for <strong>culturally-sensitive survey design</strong>.</p>

<h3>Cultural Dimensions That Impact Responses</h3>
<img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1000" alt="International Collaboration" class="article-inline-image" />

<table>
<tr><th>Dimension</th><th>Impact on Surveys</th><th>Mitigation Strategy</th></tr>
<tr><td>Individualism vs. Collectivism</td><td>Different interpretations of "I" vs "We"</td><td>Use neutral language</td></tr>
<tr><td>Power Distance</td><td>Comfort criticizing authority</td><td>Ensure anonymity</td></tr>
<tr><td>Uncertainty Avoidance</td><td>Preference for specific vs. open questions</td><td>Balance question types</td></tr>
<tr><td>Context Sensitivity</td><td>Direct vs. indirect communication</td><td>Test with local population</td></tr>
</table>

<h3>The Translation Challenge</h3>
<p>Translation is <em>not</em> just about converting words—it''s about preserving meaning.</p>

<blockquote>
"We found that a 5-star rating means different things in different cultures. In some countries, giving 5 stars is rare; in others, it''s the default positive response." - Fatima Hassan, Survey Researcher
</blockquote>

<h3>Best Practices for Global Surveys</h3>
<ol>
<li><strong>Use Back-Translation:</strong> Translate to target language, then back to source</li>
<li><strong>Local Pilot Testing:</strong> Test with native speakers before launch</li>
<li><strong>Cultural Consultants:</strong> Work with local experts</li>
<li><strong>Flexible Scales:</strong> Consider different scale interpretations</li>
<li><strong>Visual Aids:</strong> Use images to transcend language barriers</li>
</ol>

<img src="https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=900" alt="Translation Work" class="article-inline-image" />

<h3>Demographic Data Collection</h3>
<p>⚠️ <strong>Important:</strong> Privacy laws and cultural norms vary significantly:</p>
<ul>
<li>🇪🇺 <strong>GDPR (Europe):</strong> Strict consent and data protection</li>
<li>🇨🇳 <strong>China:</strong> Government data regulations</li>
<li>🇦🇪 <strong>Middle East:</strong> Sensitivity around certain personal questions</li>
<li>🇯🇵 <strong>Japan:</strong> High privacy expectations</li>
</ul>

<h3>Time Zone Considerations</h3>
<p>Launch surveys when respondents are most likely to engage:</p>
<img src="https://images.unsplash.com/photo-1495364141860-b0d03eccd065?w=800" alt="World Clock" class="article-inline-image" />

<p><strong>Pro Tip:</strong> Use UTC-based scheduling and send reminders at locally-appropriate times in each region.</p>

<p class="conclusion">🌍 Remember: Cultural sensitivity isn''t just ethical—it improves response rates and data quality!</p>
</div>', 1, true),

('Mobile-First Survey Design: Optimize for On-the-Go Responses', 
'<div class="article-content">
<img src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200" alt="Mobile Phone Survey" class="article-hero-image" />

<h2>Why Mobile Optimization Is Non-Negotiable</h2>
<p>📱 Over <strong>65% of survey responses</strong> now come from mobile devices. Yet many surveys still feel clunky on phones. Let''s fix that.</p>

<h3>The Mobile User Experience</h3>
<img src="https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1000" alt="Mobile UX Design" class="article-inline-image" />

<p>Mobile respondents face unique challenges:</p>
<ul>
<li>⏱️ <strong>Limited Time:</strong> Often completing surveys during commutes or breaks</li>
<li>📏 <strong>Small Screens:</strong> Reduced visual real estate</li>
<li>👆 <strong>Touch Interface:</strong> Different interaction patterns than mouse/keyboard</li>
<li>📶 <strong>Variable Connectivity:</strong> May have spotty internet access</li>
</ul>

<h3>Design Principles for Mobile Success</h3>

<h4>1. Keep It Short</h4>
<blockquote>
"Mobile surveys should take 5 minutes or less. Beyond that, abandon rates skyrocket." - Sofia Andersson, Design Strategist
</blockquote>

<h4>2. One Question at a Time</h4>
<p>✅ <strong>DO:</strong> Present one question per screen<br>
❌ <strong>DON''T:</strong> Require scrolling within a single question</p>

<img src="https://images.unsplash.com/photo-1551650975-87deedd944c3?w=900" alt="Mobile Survey Interface" class="article-inline-image" />

<h4>3. Touch-Friendly Controls</h4>
<table>
<tr><th>Element Type</th><th>Minimum Size</th><th>Recommended</th></tr>
<tr><td>Buttons</td><td>44x44 pixels</td><td>48x48 pixels</td></tr>
<tr><td>Radio Buttons</td><td>40x40 pixels</td><td>46x46 pixels</td></tr>
<tr><td>Checkboxes</td><td>40x40 pixels</td><td>46x46 pixels</td></tr>
<tr><td>Text Input Fields</td><td>Full width</td><td>Minimum 40px height</td></tr>
</table>

<h3>Question Type Optimization</h3>

<p><strong>Best for Mobile:</strong></p>
<ul>
<li>✓ Slider scales (easy to drag)</li>
<li>✓ Large buttons for multiple choice</li>
<li>✓ Star ratings (visual and intuitive)</li>
<li>✓ Emoji reactions</li>
</ul>

<p><strong>Avoid on Mobile:</strong></p>
<ul>
<li>✗ Long dropdown menus (hard to navigate)</li>
<li>✗ Complex matrix questions</li>
<li>✗ Tiny checkboxes</li>
<li>✗ Required free-text essays</li>
</ul>

<img src="https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800" alt="Mobile Interface Components" class="article-inline-image" />

<h3>Technical Considerations</h3>

<h4>Progressive Loading</h4>
<p>Load one question at a time to reduce initial page weight and handle poor connections gracefully.</p>

<h4>Auto-Save Progress</h4>
<p>💾 Save responses automatically so users can resume if interrupted.</p>

<h4>Smart Keyboards</h4>
<p>Trigger appropriate keyboards for each input type:</p>
<ul>
<li>📧 Email inputs → Email keyboard</li>
<li>🔢 Phone numbers → Numeric keypad</li>
<li>📅 Dates → Date picker</li>
</ul>

<h3>Testing Checklist</h3>
<ol>
<li>✓ Test on actual devices, not just emulators</li>
<li>✓ Check both portrait and landscape orientations</li>
<li>✓ Verify on iOS and Android</li>
<li>✓ Test with slow 3G connections</li>
<li>✓ Ensure text is readable without zooming</li>
</ol>

<img src="https://images.unsplash.com/photo-1556155092-8707de31f9c4?w=800" alt="Mobile Testing" class="article-inline-image" />

<p class="conclusion"><strong>Bottom Line:</strong> Mobile-first design isn''t optional—it''s essential for modern survey success! 🚀</p>
</div>', 1, true),

('From Data to Decisions: Building Actionable Survey Insights', 
'<div class="article-content">
<img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200" alt="Business Team Meeting" class="article-hero-image" />

<h2>Turning Survey Results Into Business Impact</h2>
<p>Collecting data is easy. Turning it into <strong>meaningful action</strong> is the real challenge. This guide shows you how to bridge the gap between insights and implementation.</p>

<h3>The Analysis-to-Action Framework</h3>
<img src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1000" alt="Strategic Planning" class="article-inline-image" />

<ol>
<li><strong>Identify:</strong> What does the data reveal?</li>
<li><strong>Prioritize:</strong> Which findings matter most?</li>
<li><strong>Strategize:</strong> What actions address these findings?</li>
<li><strong>Implement:</strong> Execute with clear ownership</li>
<li><strong>Measure:</strong> Track impact with follow-up surveys</li>
</ol>

<h3>Case Study: Employee Engagement Survey</h3>

<blockquote>
"Our survey revealed that 60% of employees wanted flexible hours. Within 3 months of implementing flex time, engagement scores jumped 22%." - Marcus Johnson, Healthcare Administrator
</blockquote>

<table>
<tr><th>Finding</th><th>Action Taken</th><th>Impact</th></tr>
<tr><td>Low job satisfaction (avg 3.2/5)</td><td>Implemented flex hours policy</td><td>↑ 22% engagement</td></tr>
<tr><td>Limited development opportunities</td><td>Launched mentorship program</td><td>↑ 35% retention</td></tr>
<tr><td>Poor internal communication</td><td>Weekly team standups</td><td>↑ 18% collaboration</td></tr>
</table>

<h3>Creating Compelling Visualizations</h3>
<p>📊 Your insights are only as good as your ability to communicate them.</p>

<img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900" alt="Data Dashboard" class="article-inline-image" />

<p><strong>Visualization Best Practices:</strong></p>
<ul>
<li>📈 <strong>Trend Lines:</strong> Show changes over time</li>
<li>🥧 <strong>Pie Charts:</strong> Display percentage breakdowns (max 5 slices)</li>
<li>📊 <strong>Bar Charts:</strong> Compare categories side-by-side</li>
<li>🎯 <strong>Scorecards:</strong> Highlight key metrics</li>
<li>🗺️ <strong>Heat Maps:</strong> Show intensity across segments</li>
</ul>

<h3>The Insight Prioritization Matrix</h3>

<table>
<tr><th></th><th>High Impact</th><th>Low Impact</th></tr>
<tr><td><strong>Easy to Fix</strong></td><td>🎯 Quick Wins<br>(Do First)</td><td>💡 Nice to Have<br>(Do Later)</td></tr>
<tr><td><strong>Hard to Fix</strong></td><td>🏔️ Major Projects<br>(Plan Carefully)</td><td>❌ Time Wasters<br>(Ignore)</td></tr>
</table>

<h3>Building a Feedback Loop</h3>
<p>Surveys shouldn''t be one-time events. Create a continuous improvement cycle:</p>

<img src="https://images.unsplash.com/photo-1564069114553-7215e1ff1890?w=800" alt="Feedback Loop Diagram" class="article-inline-image" />

<h4>The Quarterly Cadence</h4>
<ol>
<li><strong>Q1:</strong> Conduct initial survey, analyze results</li>
<li><strong>Q2:</strong> Implement top 3 recommendations, communicate progress</li>
<li><strong>Q3:</strong> Run pulse survey to measure impact</li>
<li><strong>Q4:</strong> Refine approach, plan next full survey</li>
</ol>

<h3>Stakeholder Communication</h3>
<blockquote>
"When presenting survey findings to executives, lead with business impact. They don''t need to see every data point—just the ones that drive decisions." - Liam O''Connor, Marketing Director
</blockquote>

<p><strong>Executive Summary Template:</strong></p>
<ul>
<li>🎯 Top 3 findings (one sentence each)</li>
<li>💰 Business impact/risk</li>
<li>✅ Recommended actions</li>
<li>📅 Implementation timeline</li>
<li>💵 Resource requirements</li>
</ul>

<img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800" alt="Executive Presentation" class="article-inline-image" />

<h3>Measuring ROI of Survey-Driven Changes</h3>
<p>Track these metrics to demonstrate value:</p>
<ul>
<li>📈 Performance improvements (sales, productivity, etc.)</li>
<li>😊 Satisfaction score changes</li>
<li>🔄 Customer/employee retention rates</li>
<li>💬 Referral/recommendation rates</li>
<li>⏱️ Time/cost savings</li>
</ul>

<h3>Common Pitfalls to Avoid</h3>
<p>❌ <strong>Analysis paralysis:</strong> Don''t wait for perfect data<br>
❌ <strong>Confirmation bias:</strong> Look for insights that challenge assumptions<br>
❌ <strong>Action without data:</strong> Ensure decisions tie to findings<br>
❌ <strong>Poor follow-up:</strong> Communicate what changed based on feedback</p>

<p class="conclusion"><strong>Remember:</strong> The best survey is one that leads to meaningful change. Focus on action, not just analysis! 🎯</p>
</div>', 1, true)
ON CONFLICT DO NOTHING;






