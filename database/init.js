// Database initialization script
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres', // Connect to default database to create new one
});

const initDatabase = async () => {
    try {
        console.log('🚀 Starting database initialization...\n');

        // Step 1: Create database
        console.log('📦 Creating database...');
        const dbName = process.env.DB_NAME;

        try {
            await pool.query(`CREATE DATABASE ${dbName}`);
            console.log(`✅ Database '${dbName}' created successfully\n`);
        } catch (err) {
            if (err.message.includes('already exists')) {
                console.log(`⚠️  Database '${dbName}' already exists\n`);
            } else {
                throw err;
            }
        }

        // Close connection to postgres database
        await pool.end();

        // Step 2: Connect to the new database and run schema
        const newPool = new Pool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });

        console.log('📋 Running database migrations...');
        
        // Run all migrations in order
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
            '12_add_signup_otp_verifications.sql'
        ];

        for (const migration of migrations) {
            try {
                console.log(`  ➜ Running ${migration}...`);
                const schema = fs.readFileSync(
                    path.join(__dirname, './migrations', migration),
                    'utf8'
                );
                await newPool.query(schema);
                console.log(`  ✓ ${migration} completed`);
            } catch (err) {
                console.log(`  ⚠️  ${migration} - ${err.message}`);
            }
        }
        console.log('✅ Migrations completed\n');

        // Step 3: Seed data
        try {
            console.log('🌱 Inserting seed data...');
            const seedData = fs.readFileSync(
                path.join(__dirname, './seeds/seed_data.sql'),
                'utf8'
            );

            await newPool.query(seedData);
            console.log('✅ Seed data inserted successfully\n');
        } catch (err) {
            console.log(`⚠️  Seed data error: ${err.message}\n`);
        }

        console.log('🎉 Database initialization completed successfully!');
        console.log(`✨ Database: ${process.env.DB_NAME}`);
        console.log(`✨ Host: ${process.env.DB_HOST}:${process.env.DB_PORT}\n`);

        await newPool.end();
    } catch (err) {
        console.error('❌ Error initializing database:', err.message);
        process.exit(1);
    }
};

initDatabase();
