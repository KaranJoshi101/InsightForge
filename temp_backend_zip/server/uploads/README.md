# Runtime Uploads

This directory stores server-managed uploaded files.

## Current structure

- `articles/` - article images uploaded by admins (recommended)

## Public URL format

Server exposes this folder at:

- `/uploads/<path>`

Examples:

- `/uploads/articles/hero-2026-03-10.jpg`
- `/uploads/articles/figure-1.png`

## Notes

- Keep this directory writable by the backend process.
- In production, map this directory to persistent storage (volume, object storage sync, or CDN origin).
