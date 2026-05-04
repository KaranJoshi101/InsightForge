const pool = require('./config/database');

async function checkNotes() {
  try {
    const result = await pool.query('SELECT id, title, document_url, created_at FROM training_notes ORDER BY created_at DESC LIMIT 5');
    console.log('\n=== NOTES IN DATABASE ===');
    result.rows.forEach((row, i) => {
      console.log(`\n${i + 1}. ID: ${row.id}`);
      console.log(`   Title: "${row.title}"`);
      console.log(`   Document URL: ${row.document_url || '(empty)'}`);
      console.log(`   Created: ${row.created_at}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Query error:', err.message);
    process.exit(1);
  }
}

checkNotes();
