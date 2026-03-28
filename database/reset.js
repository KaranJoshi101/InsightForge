// Database reset and initialization script
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const resetDatabase = async () => {
    try {
        console.log('🚀 Starting database reset and initialization...\n');

        // Connect to postgres database
        const adminPool = new Pool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: 'postgres',
        });

        const dbName = process.env.DB_NAME;

        // Step 1: Drop existing database
        console.log('🗑️  Dropping existing database...');
        try {
            await adminPool.query(`DROP DATABASE IF EXISTS ${dbName}`);
            console.log(`✅ Database '${dbName}' dropped\n`);
        } catch (err) {
            console.log(`⚠️  Could not drop database: ${err.message}\n`);
        }

        // Step 2: Create fresh database
        console.log('📦 Creating fresh database...');
        await adminPool.query(`CREATE DATABASE ${dbName}`);
        console.log(`✅ Database '${dbName}' created\n`);

        await adminPool.end();

        // Step 3: Connect to new database and run migrations
        const newPool = new Pool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });

        console.log('📋 Running database migrations...');
        
        const migrations = [
            '01_initial_schema.sql',
            '02_add_is_banned.sql',
            '03_add_profile_fields.sql',
            '04_add_question_type_filters.sql',
            '05_add_media_posts.sql',
            '06_add_media_details_survey.sql',
            '07_refactor_media_to_use_article_id.sql',
            '08_create_training_videos.sql',
            '09_create_training_playlists.sql',
            '10_add_youtube_playlist_url.sql',
            '11_add_survey_submission_email_fields.sql',
            '12_add_signup_otp_verifications.sql',
            '13_add_training_categories_and_notes.sql'
        ];

        for (const migration of migrations) {
            console.log(`  ➜ Running ${migration}...`);
            const schema = fs.readFileSync(
                path.join(__dirname, './migrations', migration),
                'utf8'
            );
            await newPool.query(schema);
            console.log(`  ✓ ${migration} completed`);
        }
        console.log('✅ All migrations completed\n');

        // Step 4: Insert seed data
        console.log('🌱 Inserting seed data...');
        const seedData = fs.readFileSync(
            path.join(__dirname, './seeds/seed_data.sql'),
            'utf8'
        );

        await newPool.query(seedData);
        console.log('✅ Seed data inserted successfully\n');

        // Step 5: Verify data
        console.log('🔍 Verifying data insertion...');
        const results = await newPool.query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as users_count,
                (SELECT COUNT(*) FROM surveys) as surveys_count,
                (SELECT COUNT(*) FROM questions) as questions_count,
                (SELECT COUNT(*) FROM responses) as responses_count,
                (SELECT COUNT(*) FROM answers) as answers_count,
                (SELECT COUNT(*) FROM articles) as articles_count
        `);
        
        const counts = results.rows[0];
        console.log('📊 Data Summary:');
        console.log(`   Users: ${counts.users_count}`);
        console.log(`   Surveys: ${counts.surveys_count}`);
        console.log(`   Questions: ${counts.questions_count}`);
        console.log(`   Responses: ${counts.responses_count}`);
        console.log(`   Answers: ${counts.answers_count}`);
        console.log(`   Articles: ${counts.articles_count}\n`);

        console.log('🎉 Database reset and initialization completed successfully!');
        console.log(`✨ Database: ${process.env.DB_NAME}`);
        console.log(`✨ Host: ${process.env.DB_HOST}:${process.env.DB_PORT}\n`);

        await newPool.end();
    } catch (err) {
        console.error('❌ Error:', err.message);
        console.error(err);
        process.exit(1);
    }
};

resetDatabase();
