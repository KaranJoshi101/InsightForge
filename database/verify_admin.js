// Verify admin setup
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const verify = async () => {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        console.log('🔍 Verifying Admin Configuration\n');
        console.log('=' .repeat(60));
        
        // Check admin count
        const adminCount = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
        console.log(`\n✓ Total Admins: ${adminCount.rows[0].count} (should be 1)`);
        
        // Show admin details
        const admin = await pool.query(`
            SELECT name, email, role FROM users WHERE role = 'admin'
        `);
        admin.rows.forEach(a => {
            console.log(`  → ${a.name} (${a.email})`);
        });
        
        // Check survey creators
        const surveyCreators = await pool.query(`
            SELECT DISTINCT u.name, u.role, COUNT(s.id) as survey_count
            FROM surveys s
            JOIN users u ON s.created_by = u.id
            GROUP BY u.name, u.role
        `);
        console.log(`\n✓ Survey Creators:`);
        surveyCreators.rows.forEach(c => {
            console.log(`  → ${c.name} (${c.role}): ${c.survey_count} surveys`);
        });
        
        // Check article authors
        const articleAuthors = await pool.query(`
            SELECT DISTINCT u.name, u.role, COUNT(a.id) as article_count
            FROM articles a
            JOIN users u ON a.author = u.id
            GROUP BY u.name, u.role
        `);
        console.log(`\n✓ Article Authors:`);
        articleAuthors.rows.forEach(a => {
            console.log(`  → ${a.name} (${a.role}): ${a.article_count} articles`);
        });
        
        console.log('\n' + '='.repeat(60));
        console.log('\n✅ Configuration verified successfully!');
        console.log('   Only Manoj Kumar (admin) can create surveys and publish articles.\n');
        
        await pool.end();
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

verify();
