const fs = require('fs');
const path = require('path');

const API_BASE = process.env.SMOKE_API_BASE || process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const USER_EMAIL = process.env.SMOKE_USER_EMAIL || '';
const USER_PASSWORD = process.env.SMOKE_USER_PASSWORD || '';

const fail = (message, details) => {
  console.error(`SMOKE FAIL: ${message}`);
  if (details) {
    console.error(details);
  }
  process.exit(1);
};

const pass = (message) => {
  console.log(`SMOKE PASS: ${message}`);
};

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch (_err) {
    return null;
  }
};

(async () => {
  try {
    const buildIndexPath = path.join(__dirname, '..', 'client', 'build', 'index.html');
    if (!fs.existsSync(buildIndexPath)) {
      console.warn('SMOKE WARN: client/build/index.html not found. Run npm run build before deployment.');
    } else {
      pass('Frontend build artifact exists');
    }

    const healthRes = await fetch(`${API_BASE.replace(/\/$/, '')}/health`);
    const healthJson = await safeJson(healthRes);

    if (!healthRes.ok || !healthJson || healthJson.status !== 'OK') {
      fail('Health check failed', healthJson || `status=${healthRes.status}`);
    }
    pass('API health check OK');

    if (USER_EMAIL && USER_PASSWORD) {
      const loginRes = await fetch(`${API_BASE.replace(/\/$/, '')}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD }),
      });
      const loginJson = await safeJson(loginRes);

      if (!loginRes.ok || !loginJson || !loginJson.token) {
        fail('Login check failed', loginJson || `status=${loginRes.status}`);
      }
      pass('Login check OK');
    } else {
      console.warn('SMOKE WARN: SMOKE_USER_EMAIL/SMOKE_USER_PASSWORD not set, skipping login check.');
    }

    console.log('SMOKE COMPLETE: All required checks passed.');
    process.exit(0);
  } catch (err) {
    fail('Unexpected smoke test error', err.message || err);
  }
})();
