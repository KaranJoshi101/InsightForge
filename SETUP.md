# Setup Guide - Survey Application

Follow these steps to run the app locally with the current MySQL-based backend.

## Prerequisites

Install the following first:

1. Node.js 18+
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. npm 9+
   - Verify: `npm --version`

3. MySQL 8+
   - Verify: `mysql --version`

4. Git (optional)
   - Download: https://git-scm.com/

## Step 1: Verify MySQL Is Running

On Windows:
1. Open Services (`Win + R`, then `services.msc`).
2. Ensure your MySQL service is running.
3. Test CLI access:

```bash
mysql -u root -p
```

If you can connect, MySQL is ready.

## Step 2: Configure Environment Variables

Create or update `.env` in the project root with MySQL values:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=survey_app
DB_USER=root
DB_PASSWORD=your_password
DB_SSL=false

SERVER_PORT=5000
NODE_ENV=development
JWT_SECRET=replace_with_a_long_random_secret
REACT_APP_API_URL=http://localhost:5000/api
```

If your MySQL username or password differs, adjust `DB_USER` and `DB_PASSWORD`.

## Step 3: Install Dependencies

From the project root:

```bash
npm run install-all
```

## Step 4: Initialize the Database

Run one of the init flows:

Option A (root script):

```bash
npm run db:init
```

Option B (database package directly):

```bash
cd database
npm run init
```

Expected result:
- Database is created if missing.
- MySQL schema is applied.
- Seed data is inserted.

## Step 5: Start the Application

Run both frontend and backend together:

```bash
npm run dev
```

Or run separately:

Terminal 1:

```bash
npm run server
```

Terminal 2:

```bash
npm run client
```

Default URLs:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health: http://localhost:5000/api/health
- DB health: http://localhost:5000/api/health/db

## Step 6: Verify Core Flows

Quick checks:

1. Health endpoint returns 200:

```bash
curl http://localhost:5000/api/health
```

2. Auth behavior:
- `POST /api/auth/register` starts OTP flow.
- `POST /api/auth/register/verify-otp` completes account creation.

3. Public resources:
- `GET /api/surveys`
- `GET /api/articles`

## Common Troubleshooting

Error: `connect ECONNREFUSED 127.0.0.1:3306`
- MySQL is not running, or port is different.
- Start MySQL service and verify `DB_PORT`.

Error: `Access denied for user ...`
- Wrong credentials in `.env`.
- Update `DB_USER` and `DB_PASSWORD`.

Error: `ER_BAD_DB_ERROR: Unknown database 'survey_app'`
- Init did not run successfully.
- Re-run `npm run db:init`.

Error: app tests hitting stale server state
- A previous process may still be bound to port 5000.
- Stop old process or temporarily run with a different `SERVER_PORT`.

## Useful Commands

```bash
# Install dependencies for all packages
npm run install-all

# Initialize database
npm run db:init

# Run backend + frontend
npm run dev

# Run backend only
npm run server

# Run frontend only
npm run client

# Smoke test
npm run smoke
```

## References

- README.md
- docs/PROJECT_DOCUMENTATION.md
- docs/API_DOCUMENTATION.md
- docs/DATABASE_SCHEMA.md
- DEPLOYMENT.md
