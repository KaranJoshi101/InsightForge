-- Fix database to have only one admin
-- Update Yuki Tanaka from admin to user
UPDATE users 
SET role = 'user', 
    bio = 'Market research director with 15+ years experience in consumer insights.'
WHERE email = 'yuki.tanaka@corp.jp';

-- Update Manoj Kumar's bio to reflect he is the admin
UPDATE users 
SET bio = 'Assistant Professor specializing in biostatistics, health economics, and applied data analysis.'
WHERE email = 'manojkumar@jnu.ac.in';

-- Update all surveys to be created by admin (user 1 - Manoj Kumar)
UPDATE surveys SET created_by = 1 WHERE created_by != 1;

-- Update all articles to be authored by admin (user 1 - Manoj Kumar)
UPDATE articles SET author = 1 WHERE author != 1;

-- Verify the changes
SELECT 'Users with admin role:' as check_type, COUNT(*) as count FROM users WHERE role = 'admin'
UNION ALL
SELECT 'Surveys created by non-admin:', COUNT(*) FROM surveys WHERE created_by != 1
UNION ALL
SELECT 'Articles by non-admin:', COUNT(*) FROM articles WHERE author != 1;
