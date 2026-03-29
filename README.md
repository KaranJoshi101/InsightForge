# Survey App (PERN Stack)

Survey platform built with PostgreSQL, Express, React, and Node.js.

## Features

- JWT authentication (user/admin roles)
- Survey creation, publishing, and response collection
- Analytics endpoints (including demographics and export)
- Article publishing and management
- Consulting services pages with consultation request capture
- Admin dashboard for users, surveys, and content

## Tech Stack

- Backend: Node.js, Express, PostgreSQL
- Frontend: React (CRA + CRACO)
- Auth: JWT + bcrypt

## Project Structure

```text
survey-app/
  client/      React frontend
  server/      Express API
  database/    SQL migrations and seed scripts
  docs/        Project documentation
```

## Image Storage

Use two image locations depending on the use case:

- Static frontend assets (landing/profile/fixed article visuals):
  `client/public/static/images/...`
- Runtime article uploads (admin-managed):
  `server/uploads/articles/...`

Public URL patterns:

- Frontend static: `/static/images/<subfolder>/<file-name>`
- Backend uploads: `http://localhost:5000/uploads/articles/<file-name>`

Details and examples: `docs/IMAGE_STORAGE.md`

## Master Project Specification

For a single consolidated source containing architecture, use cases, DFD inputs, sequence flows, API inventory, database schema, and UML component mapping, use:

`docs/MASTER_PROJECT_DIAGRAM_SPEC.md`

For a complete operational and implementation-oriented master document (setup, scripts, architecture, modules, deployment, and documentation map), use:

`docs/PROJECT_DOCUMENTATION.md`

## Deployment

Deployment checklist and production setup are documented in:

`DEPLOYMENT.md`

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL 12+

## Environment Setup

Create a `.env` file in the project root (`survey-app/.env`) with values like:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=survey_app
DB_USER=postgres
DB_PASSWORD=your_password

SERVER_PORT=5000
NODE_ENV=development

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRE=1h

REACT_APP_API_URL=http://localhost:5000/api
```

For production, use:

- `.env.production.example` as the template
- `DEPLOYMENT.md` for full runbook

## Install Dependencies

From the root folder:

```bash
npm run install-all
```

## Database Setup

Option 1: Run init script (creates DB and runs schema/seed)

```bash
npm run db:init
```

Option 2: Manual SQL setup

```bash
psql -U postgres
CREATE DATABASE survey_app;
\c survey_app
\i database/migrations/01_initial_schema.sql
\i database/migrations/02_add_is_banned.sql
\i database/migrations/03_add_profile_fields.sql
\i database/seeds/seed_data.sql
```

## Run The Project

Run both frontend and backend:

```bash
npm run dev
```

Or run separately:

```bash
npm run server
npm run client
```

App URLs:

- Frontend: `http://localhost:3000`
- API: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

## Useful Scripts

- `npm run dev` - Run server and client together
- `npm run server` - Run backend only
- `npm run client` - Run frontend only
- `npm run build` - Build frontend for production
- `npm run smoke` - Run post-deploy smoke checks (health/login/build artifact)
- `npm start` - Start backend in production mode
- `npm run pm2:start` - Start backend with PM2 using `ecosystem.config.js`
- `npm run pm2:restart` - Restart PM2 app and refresh env
- `npm run pm2:stop` - Stop PM2 app
- `npm run db:init` - Initialize database
- `npm run install-all` - Install root/server/client dependencies

## Push To GitHub

From `survey-app/`:

```bash
git add .
git commit -m "Prepare project for GitHub"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

If `origin` already exists, update it:

```bash
git remote set-url origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

## License

MIT
