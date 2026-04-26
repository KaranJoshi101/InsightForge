const urls = [
  'http://localhost:5000/api/health',
  'http://localhost:5000/api/health/db',
  'http://localhost:5000/api/surveys?page=1&limit=5',
  'http://localhost:5000/api/articles?page=1&limit=5',
  'http://localhost:5000/api/media?page=1&limit=5',
  'http://localhost:5000/api/training/categories',
  'http://localhost:5000/api/consulting',
];

(async () => {
  for (const url of urls) {
    try {
      const response = await fetch(url);
      const text = await response.text();
      let json = null;

      try {
        json = JSON.parse(text);
      } catch (_err) {
        json = null;
      }

      const shape = json ? Object.keys(json).slice(0, 8).join(',') : 'non-json';
      console.log(`${response.status} ${url} :: ${shape}`);
    } catch (err) {
      console.log(`ERR ${url} :: ${err.message}`);
    }
  }
})();
