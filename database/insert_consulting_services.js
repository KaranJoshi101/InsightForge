const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const baseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'survey_app',
};

async function insertConsultingServices() {
    let conn;
    try {
        console.log('Connecting to database...');
        conn = await mysql.createConnection(baseConfig);

        console.log('Reading SQL file...');
        const sqlFilePath = path.join(__dirname, 'insert_consulting_services.sql');
        const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('Executing INSERT statement...');
        await conn.execute(sqlScript);

        console.log('✅ Consulting services data inserted successfully!');
    } catch (error) {
        console.error('❌ Error inserting data:', error.message);
        process.exit(1);
    } finally {
        if (conn) await conn.end();
    }
}

insertConsultingServices();