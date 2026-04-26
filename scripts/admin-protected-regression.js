const apiBase = process.env.API_BASE || 'http://localhost:5000/api';

const buildEndpoints = (surveyId) => {
  const endpoints = [
    ['GET', `${apiBase}/auth/me`],
    ['GET', `${apiBase}/users/dashboard-stats`],
    ['GET', `${apiBase}/users?page=1&limit=5`],
    ['GET', `${apiBase}/articles/admin/my-articles?page=1&limit=5`],
    ['GET', `${apiBase}/analytics/overview`],
    ['GET', `${apiBase}/analytics/trends`],
    ['GET', `${apiBase}/consulting/admin/services?page=1&limit=5`],
    ['GET', `${apiBase}/consulting/analytics/overview`],
    ['GET', `${apiBase}/training/admin/categories`],
  ];

  if (surveyId) {
    endpoints.push(['GET', `${apiBase}/responses/survey/${surveyId}`]);
  }

  return endpoints;
};

(async () => {
  const loginRes = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.test', password: 'manoj123' }),
  });

  const loginText = await loginRes.text();
  let loginJson = null;
  try {
    loginJson = JSON.parse(loginText);
  } catch (_err) {
    loginJson = null;
  }

  console.log(`login ${loginRes.status} ${loginJson ? Object.keys(loginJson).join(',') : 'non-json'}`);
  if (!loginRes.ok || !loginJson?.token) {
    console.log(loginText);
    process.exitCode = 1;
    return;
  }

  const headers = {
    Authorization: `Bearer ${loginJson.token}`,
    'Content-Type': 'application/json',
  };

  let surveyId = null;
  try {
    const surveysRes = await fetch(`${apiBase}/surveys?page=1&limit=1`, { method: 'GET', headers });
    const surveysJson = await surveysRes.json();
    surveyId = surveysJson?.surveys?.[0]?.id || null;
    if (!surveyId) {
      console.log('info no-survey-found: skipping responses/survey/:id check');
    }
  } catch (_err) {
    console.log('info survey-probe-failed: skipping responses/survey/:id check');
  }

  const endpoints = buildEndpoints(surveyId);

  for (const [method, url] of endpoints) {
    try {
      const response = await fetch(url, { method, headers });
      const text = await response.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch (_err) {
        json = null;
      }

      const keys = json ? Object.keys(json).slice(0, 8).join(',') : 'non-json';
      console.log(`${response.status} ${url} :: ${keys}`);
    } catch (err) {
      console.log(`ERR ${url} :: ${err.message}`);
    }
  }
})();
