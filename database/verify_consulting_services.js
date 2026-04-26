const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const baseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'survey_app',
};

async function verifyConsultingServices() {
    let conn;
    try {
        console.log('Connecting to database...');
        conn = await mysql.createConnection(baseConfig);

        console.log('Verifying consulting services data...');
        const [rows] = await conn.execute('SELECT id, title, slug, is_active FROM consulting_services ORDER BY id');

        console.log(`Found ${rows.length} consulting services:`);
        rows.forEach(row => {
            console.log(`- ID ${row.id}: ${row.title} (${row.slug}) - Active: ${row.is_active}`);
        });

        console.log('✅ Verification complete!');
    } catch (error) {
        console.error('❌ Error verifying data:', error.message);
        process.exit(1);
    } finally {
        if (conn) await conn.end();
    }
}

verifyConsultingServices();