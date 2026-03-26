# Deployment Guide

## 1. Prepare Environment

Create deployment env values from `.env.production.example` and set production values:

- `NODE_ENV=production`
- `SERVER_PORT` to the port your host exposes
- `JWT_SECRET` to a long random secret (32+ chars)
- `CORS_ORIGINS` to your frontend origin(s), comma-separated
- Database credentials (`DB_*`)
- `DB_SSL=true` if your managed Postgres requires TLS
- SMTP values (`SMTP_*`) if survey confirmation emails are required

## 2. Install Dependencies

Run from project root:

```bash
npm install
```

Root `postinstall` installs both server and client dependencies.

## 3. Build Frontend

```bash
npm run build
```

This generates `client/build`.

## 4. Start API

```bash
npm start
```

or with PM2:

```bash
npm run pm2:start
```

Health endpoint:

- `GET /api/health`

## 5. Reverse Proxy Recommendations

Use Nginx/Apache/Caddy in front of Node:

- Route `/api/*` and `/uploads/*` to the Node backend
- Serve static frontend build from CDN or web server
- Enable HTTPS and redirect HTTP to HTTPS

If deployed behind a reverse proxy/load balancer, set:

- `TRUST_PROXY=1`

## 6. Production Checklist

- `.env` is not committed
- Port alignment is correct (`SERVER_PORT` and frontend API target)
- `CORS_ORIGINS` includes only trusted domains
- Strong `JWT_SECRET` configured
- Database backups enabled
- Process manager configured (PM2/systemd/container orchestration)
- Logs are captured and rotated
- Spam folder checks completed for SMTP sender domain

## 7. Optional Smoke Tests

- API health: `GET /api/health` returns `status: OK`
- User login works
- Survey submit works and duplicate submit returns 409
- Submission email reports `sent: true` when SMTP is configured

Automated smoke test:

```bash
npm run smoke
```

Optional environment variables for login probe:

- `SMOKE_API_BASE`
- `SMOKE_USER_EMAIL`
- `SMOKE_USER_PASSWORD`
