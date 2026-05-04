const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

const updatePassword = async () => {
    try {
        const targetEmail = 'admin@example.test';
        const targetPasswordHash = '$2a$10$LVtW6aDEwsV3Flu9c1tLCuw7CkHoQrP5KcnzqRrs3913Iml1xs9iG';

        const result = await pool.query(
            `UPDATE users
             SET email = $1,
                 password_hash = $2,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = (
                 SELECT id
                 FROM users
                 WHERE email = $1 OR role = 'admin'
                 ORDER BY CASE WHEN email = $1 THEN 0 ELSE 1 END, id
                 LIMIT 1
             )
             RETURNING id, email, role`,
            [targetEmail, targetPasswordHash]
        );
        
        if (result.rows.length > 0) {
            console.log('✅ Admin credentials updated successfully');
            console.log('Email:', result.rows[0].email);
            console.log('Role:', result.rows[0].role);
            console.log('\nYou can now login with:');
            console.log('Email:', targetEmail);
            console.log('Password: manoj123');
        } else {
            console.log('❌ Admin user not found');
        }
        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

updatePassword();
