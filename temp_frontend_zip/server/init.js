// Database initialization script
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const baseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
};

const executeSqlSafely = async (conn, sqlScript) => {
    const statements = sqlScript
        .split(/;\s*(?:\r?\n|$)/)
        .map((stmt) => stmt.trim())
        .filter(Boolean);

    for (const statement of statements) {
        try {
            await conn.query(statement);
        } catch (err) {
            const duplicateIndexError = err?.code === 'ER_DUP_KEYNAME' || /Duplicate key name/i.test(err?.message || '');
            if (duplicateIndexError) {
                continue;
            }

            throw err;
        }
    }
};

const normalizeSeedSqlForMySql = (sqlScript) => {
    return String(sqlScript || '')
        .replace(/\bINSERT\s+INTO\b/gi, 'INSERT IGNORE INTO')
        .replace(/CURRENT_TIMESTAMP\s*-\s*INTERVAL\s*'([0-9]+)\s+days'/gi, 'DATE_SUB(CURRENT_TIMESTAMP, INTERVAL $1 DAY)')
        .replace(/CURRENT_TIMESTAMP\s*-\s*INTERVAL\s*'([0-9]+)\s+hours'/gi, 'DATE_SUB(CURRENT_TIMESTAMP, INTERVAL $1 HOUR)')
        .replace(/CURRENT_TIMESTAMP\s*-\s*INTERVAL\s*'([0-9]+)\s+minutes'/gi, 'DATE_SUB(CURRENT_TIMESTAMP, INTERVAL $1 MINUTE)')
        .replace(/\n?\s*ON\s+CONFLICT\s*(?:\([^)]+\))?\s+DO\s+NOTHING;?/gi, ';');
};

const initDatabase = async () => {
    try {
        console.log('🚀 Starting database initialization...\n');

        // Step 1: Create database
        console.log('📦 Creating database...');
        const dbName = process.env.DB_NAME || 'insightforge';

        const adminConn = await mysql.createConnection(baseConfig);

        try {
            await adminConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
            console.log(`✅ Database '${dbName}' created successfully\n`);
        } catch (err) {
            throw err;
        }

        await adminConn.end();

        // Step 2: Connect to the new database and run schema
        const conn = await mysql.createConnection({
            ...baseConfig,
            database: dbName,
        });

        console.log('📋 Running MySQL schema...');
        const schemaSql = fs.readFileSync(
            path.join(__dirname, '../database/mysql/schema.sql'),
            'utf8'
        );
        await executeSqlSafely(conn, schemaSql);
        console.log('✅ Schema applied\n');

        // Step 3: Seed data (optional)
        try {
            console.log('🌱 Inserting seed data...');
            const mysqlSeedPath = path.join(__dirname, '../database/seeds/seed_data.mysql.sql');
            const defaultSeedPath = path.join(__dirname, '../database/seeds/seed_data.sql');
            const seedPath = fs.existsSync(mysqlSeedPath) ? mysqlSeedPath : defaultSeedPath;

            if (!fs.existsSync(seedPath)) {
                throw new Error('No seed file found');
            }

            const seedData = normalizeSeedSqlForMySql(fs.readFileSync(seedPath, 'utf8'));
            await executeSqlSafely(conn, seedData);

            const mediaSeedPath = path.join(__dirname, '../database/seeds/seed_media_posts.sql');
            if (fs.existsSync(mediaSeedPath)) {
                const mediaSeed = normalizeSeedSqlForMySql(fs.readFileSync(mediaSeedPath, 'utf8'));
                await executeSqlSafely(conn, mediaSeed);
            }
            console.log('✅ Seed data inserted successfully\n');
        } catch (err) {
            console.log('⚠️  Skipping seed data (may already exist)\n');
        }

        console.log('🎉 Database initialization completed successfully!');
        console.log(`✨ Database: ${dbName}`);
        console.log(`✨ Host: ${process.env.DB_HOST}:${process.env.DB_PORT}\n`);

        await conn.end();
    } catch (err) {
        console.error('❌ Error initializing database:', err.message);
        process.exit(1);
    }
};

initDatabase();
