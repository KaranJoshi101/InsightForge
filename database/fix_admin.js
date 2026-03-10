// Fix admin permissions - ensure only one admin
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const fixAdmin = async () => {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        console.log('🔧 Fixing admin permissions...\n');

        const fixSQL = fs.readFileSync(
            path.join(__dirname, 'fix_admin.sql'),
            'utf8'
        );

        await pool.query(fixSQL);

        console.log('✅ Admin permissions fixed!\n');
        console.log('📊 Current state:');
        
        const results = await pool.query(`
            SELECT 
                u.name, 
                u.email, 
                u.role,
                (SELECT COUNT(*) FROM surveys WHERE created_by = u.id) as surveys_created,
                (SELECT COUNT(*) FROM articles WHERE author = u.id) as articles_authored
            FROM users u
            WHERE u.role = 'admin' OR u.id = 1
            ORDER BY u.id
        `);

        results.rows.forEach(row => {
            console.log(`\n👤 ${row.name} (${row.email})`);
            console.log(`   Role: ${row.role}`);
            console.log(`   Surveys created: ${row.surveys_created}`);
            console.log(`   Articles authored: ${row.articles_authored}`);
        });

        console.log('\n✨ Only Manoj Kumar (admin) can now create surveys and publish articles!');
        
        await pool.end();
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

fixAdmin();
