require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const db = require('../config/database');

const tables = [
  'users', 'surveys', 'questions', 'options', 'responses', 'answers', 'articles', 'media_posts',
  'signup_otp_verifications', 'consulting_services', 'consulting_requests', 'consulting_events',
  'platform_events', 'training_categories', 'training_videos', 'training_playlists', 'playlist_items',
  'training_notes', 'survey_conditional_rules', 'survey_drafts', 'article_drafts'
];

(async () => {
  const report = [];

  for (const table of tables) {
    const existsResult = await db.query(
      `SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = $1`,
      [table]
    );

    const exists = Number(existsResult.rows[0].c) > 0;

    if (!exists) {
      report.push({ table, exists: false, rows: null });
      continue;
    }

    const countResult = await db.query(`SELECT COUNT(*) AS c FROM ${table}`);
    report.push({ table, exists: true, rows: Number(countResult.rows[0].c) });
  }

  const fkResult = await db.query(
    `SELECT COUNT(*) AS c
     FROM information_schema.referential_constraints
     WHERE constraint_schema = DATABASE()`
  );

  console.log(JSON.stringify({
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    foreign_keys: Number(fkResult.rows[0].c),
    tables: report,
  }, null, 2));
})();
