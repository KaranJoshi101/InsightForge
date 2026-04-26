require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const db = require('../config/database');

(async () => {
  const targetEmail = 'admin@example.test';
  const targetPasswordHash = '$2a$10$LVtW6aDEwsV3Flu9c1tLCuw7CkHoQrP5KcnzqRrs3913Iml1xs9iG';
  const targetName = 'Manoj Kumar';

  const result = await db.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       password_hash = VALUES(password_hash),
       role = VALUES(role),
       updated_at = CURRENT_TIMESTAMP`,
    [targetName, targetEmail, targetPasswordHash]
  );

  const userResult = await db.query('SELECT id, name, email, role FROM users WHERE email = $1', [targetEmail]);
  console.log(JSON.stringify({
    affectedRows: result.affectedRows,
    user: userResult.rows[0] || null,
  }, null, 2));
})();
