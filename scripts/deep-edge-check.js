const apiBase = process.env.API_BASE || 'http://localhost:5000/api';
const rootBase = apiBase.replace(/\/api\/?$/, '');

const result = {
  pass: [],
  warn: [],
  fail: [],
};

const logPass = (msg) => result.pass.push(msg);
const logWarn = (msg) => result.warn.push(msg);
const logFail = (msg) => result.fail.push(msg);

const expectStatus = async (label, requestPromise, acceptedStatuses) => {
  try {
    const res = await requestPromise;
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch (_e) {
      json = null;
    }

    if (acceptedStatuses.includes(res.status)) {
      logPass(`${label}: status ${res.status}`);
      return { ok: true, status: res.status, json, text, res };
    }

    logFail(`${label}: unexpected status ${res.status}`);
    return { ok: false, status: res.status, json, text, res };
  } catch (err) {
    logFail(`${label}: request error ${err.message}`);
    return { ok: false, error: err };
  }
};

(async () => {
  const login = await expectStatus(
    'admin login',
    fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.test', password: 'manoj123' }),
    }),
    [200]
  );

  if (!login.ok || !login.json?.token) {
    console.log('DEEP_EDGE_CHECK_FAIL login');
    console.log(JSON.stringify(result, null, 2));
    process.exit(1);
  }

  const token = login.json.token;
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const surveysResp = await expectStatus(
    'list surveys',
    fetch(`${apiBase}/surveys?page=1&limit=5`, { headers: authHeaders }),
    [200]
  );

  let pickedSurvey = null;
  if (surveysResp.ok && Array.isArray(surveysResp.json?.surveys) && surveysResp.json.surveys.length > 0) {
    pickedSurvey = surveysResp.json.surveys[0];
    const sid = pickedSurvey.id;
    const slug = pickedSurvey.slug;

    await expectStatus('survey detail by id', fetch(`${apiBase}/surveys/${sid}`, { headers: authHeaders }), [200]);
    if (slug) {
      await expectStatus('survey detail by slug', fetch(`${apiBase}/surveys/${slug}`, { headers: authHeaders }), [200]);
    } else {
      logWarn('survey slug missing, skipped slug detail check');
    }

    await expectStatus('survey user-submission check', fetch(`${apiBase}/surveys/${sid}/user-submission`, { headers: authHeaders }), [200]);
    await expectStatus(
      'survey autosave',
      fetch(`${apiBase}/surveys/${sid}/autosave`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          title: pickedSurvey.title || 'Autosave title',
          description: 'edge-case autosave test',
          questions: [],
          settings: {
            allow_multiple_submissions: true,
            is_anonymous: false,
            collect_email: false,
            expiry_date: null,
          },
        }),
      }),
      [200]
    );
  } else {
    logWarn('no surveys available, skipped survey-specific edge checks');
  }

  const articlesResp = await expectStatus(
    'list articles',
    fetch(`${apiBase}/articles?page=1&limit=5`, { headers: authHeaders }),
    [200]
  );

  let pickedArticle = null;
  if (articlesResp.ok && Array.isArray(articlesResp.json?.articles) && articlesResp.json.articles.length > 0) {
    pickedArticle = articlesResp.json.articles[0];
    const aid = pickedArticle.id;
    const slug = pickedArticle.slug;

    await expectStatus('article detail by id', fetch(`${apiBase}/articles/${aid}`, { headers: authHeaders }), [200]);
    if (slug) {
      await expectStatus('article detail by slug', fetch(`${apiBase}/articles/${slug}`, { headers: authHeaders }), [200]);
    } else {
      logWarn('article slug missing, skipped article slug check');
    }

    await expectStatus(
      'article autosave',
      fetch(`${apiBase}/articles/${aid}/autosave`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          title: pickedArticle.title || 'Autosave article',
          content: pickedArticle.content || '<p>Autosave check</p>',
          meta_description: 'edge-case autosave',
          tags: 'edge,autosave',
        }),
      }),
      [200]
    );

    await expectStatus(
      'article schedule with past date (expect validation)',
      fetch(`${apiBase}/articles/${aid}/schedule`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ publish_date: '2020-01-01T00:00:00.000Z' }),
      }),
      [400]
    );
  } else {
    logWarn('no articles available, skipped article-specific edge checks');
  }

  await expectStatus('sitemap.xml', fetch(`${rootBase}/sitemap.xml`), [200]);
  await expectStatus('robots.txt', fetch(`${rootBase}/robots.txt`), [200]);

  const badResp = await expectStatus(
    'responses for unknown survey (expect 404)',
    fetch(`${apiBase}/responses/survey/999999`, { headers: authHeaders }),
    [404]
  );

  if (!badResp.ok) {
    logWarn('unknown survey responses did not return 404 as expected');
  }

  const summary = {
    passCount: result.pass.length,
    warnCount: result.warn.length,
    failCount: result.fail.length,
    ...result,
  };

  console.log('DEEP_EDGE_CHECK_SUMMARY');
  console.log(JSON.stringify(summary, null, 2));

  if (result.fail.length > 0) {
    process.exit(1);
  }
})();
