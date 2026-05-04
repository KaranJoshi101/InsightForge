const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

console.log('Connection config:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
});

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

const verifyDatabase = async () => {
    try {
        console.log('\n🔍 Verifying Database Setup...\n');

        // Test connection
        const result = await pool.query('SELECT NOW()');
        console.log('✅ Database Connection: SUCCESS');
        console.log(`   Current Time: ${result.rows[0].now}\n`);

        // Get table list
        const tables = await pool.query(`
            SELECT table_name as name FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `);

        console.log('✅ Tables Found:');
        tables.rows.forEach((row, idx) => {
            console.log(`   ${idx + 1}. ${row.name}`);
        });

        // Count records
        const userCount = await pool.query('SELECT COUNT(*) FROM users');
        const surveyCount = await pool.query('SELECT COUNT(*) FROM surveys');
        const questionCount = await pool.query('SELECT COUNT(*) FROM questions');

        console.log('\n✅ Seed Data:');
        console.log(`   Users: ${userCount.rows[0].count}`);
        console.log(`   Surveys: ${surveyCount.rows[0].count}`);
        console.log(`   Questions: ${questionCount.rows[0].count}`);

        console.log('\n✅ Database is fully set up and working!\n');

        await pool.end();
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

verifyDatabase();
