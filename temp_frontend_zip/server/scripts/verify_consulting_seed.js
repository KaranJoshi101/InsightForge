const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const pool = require('../config/database');

const run = async () => {
    try {
        const seededRequests = await pool.query(
            "SELECT COUNT(*)::int AS count FROM consulting_requests WHERE message LIKE '[SEED] %'"
        );

        const seededViews = await pool.query(
            "SELECT COUNT(*)::int AS count FROM consulting_events WHERE event_type = 'view' AND metadata->>'source' = 'seed'"
        );

        const seededSubmits = await pool.query(
            "SELECT COUNT(*)::int AS count FROM consulting_events WHERE event_type = 'submit' AND metadata->>'source' = 'seed'"
        );

        const overview = await pool.query(
            `SELECT
                COUNT(*) FILTER (WHERE event_type = 'view')::int AS total_views,
                COUNT(*) FILTER (WHERE event_type = 'submit')::int AS total_requests
             FROM consulting_events`
        );

        console.log('Seed verification:');
        console.log('seeded_requests', seededRequests.rows[0].count);
        console.log('seeded_views', seededViews.rows[0].count);
        console.log('seeded_submits', seededSubmits.rows[0].count);
        console.log('overview', overview.rows[0]);
    } catch (error) {
        console.error('Verification failed:', error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
};

run();
