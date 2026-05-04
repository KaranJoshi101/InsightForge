Delivery README — Deployment Handoff

This file is a concise deployment handoff for the operations team. It mirrors `docs/DEPLOYMENT.md` and contains the exact items included in the `deliverables/` package.

Included files in this package:

- `frontend_source.zip` — frontend source (includes `client/` and `client/package.json`). If you prefer the prebuilt static bundle, use `client/build/`.
- `backend.zip` — backend source (includes `server/`, root `package.json`, and `ecosystem.config.js`).
- `env/.env.production` — actual production environment file (sensitive). Transfer securely.
- `database/seeds/seed_admin_manoj.sql` — admin seed script (inserts admin user).
- `README.md` — this overview and safe-handoff recommendations.

Quick deploy steps (assumes files unzipped on target host):

1) Database (MySQL)

```bash
mysql -u <admin_user> -p -e "CREATE DATABASE insightforge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u <user> -p insightforge < dump.sql   # if provided
mysql -u <user> -p insightforge < database/seeds/seed_admin_manoj.sql
```

2) Backend

```bash
cd /path/to/backend
npm ci
# copy production env
cp /path/to/received/env/.env.production .env
npm start
# or with PM2
pm2 start ecosystem.config.js
```

3) Frontend (if building on target)

```bash
cd client
npm ci
npm run build
# serve client/build with your static host
```

4) Health checks

- `GET https://<host>/api/health` — should return a small JSON with `status: OK`.

Security & transfer notes

- Do NOT email `env/.env.production` or DB dumps. Use SFTP, an encrypted archive (PGP), or the client's secret manager.
- After handoff, rotate secrets if they were transferred via insecure channels.

If you want, I can create another encrypted archive (password-protected) containing only `env/.env.production` and hand you the password via a separate channel.