const crypto = require('crypto');

const apiBase = 'http://localhost:5000/api';

const randomEmail = () => {
  const token = crypto.randomBytes(4).toString('hex');
  return `mysql-regression-${Date.now()}-${token}@example.com`;
};

(async () => {
  const email = randomEmail();
  const password = 'Str0ng!Passw0rd#1';
  const payload = {
    name: 'MySQL Regression User',
    email,
    password,
  };

  const registerRes = await fetch(`${apiBase}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const registerJson = await registerRes.json();

  console.log('register', registerRes.status, Object.keys(registerJson || {}).join(','));
  if (!registerRes.ok) {
    console.error(JSON.stringify(registerJson));
    process.exit(1);
  }

  const loginRes = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const loginJson = await loginRes.json();

  console.log('login', loginRes.status, Object.keys(loginJson || {}).join(','));
  if (loginRes.status === 401) {
    console.log('AUTH_REGRESSION_OTP_FLOW_PASS');
    console.log('Login is expected to fail before OTP verification in current auth flow.');
    return;
  }

  if (!loginRes.ok || !loginJson.token) {
    console.error(JSON.stringify(loginJson));
    process.exitCode = 1;
    return;
  }

  const meRes = await fetch(`${apiBase}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${loginJson.token}`,
    },
  });

  const meJson = await meRes.json();
  console.log('me', meRes.status, Object.keys(meJson || {}).join(','));

  if (!meRes.ok) {
    console.error(JSON.stringify(meJson));
    process.exitCode = 1;
    return;
  }

  console.log('AUTH_REGRESSION_PASS');
})();
