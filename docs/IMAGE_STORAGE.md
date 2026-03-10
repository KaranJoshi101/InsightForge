# Image Storage Strategy

This project now uses a two-tier image storage model.

## 1) Frontend static images (versioned app assets)

Use when images are part of the UI and change rarely.

Location:

- `client/public/static/images/profile/`
- `client/public/static/images/articles/`

Access URLs from browser:

- `/static/images/profile/<file-name>`
- `/static/images/articles/<file-name>`

Examples:

- `/static/images/profile/admin-profile.svg`
- `/static/images/articles/digital-health-banner.svg`

## 2) Backend uploads (runtime content assets)

Use when admins need to add/replace images without rebuilding frontend.

Location:

- `server/uploads/articles/`

Access URLs from browser:

- `http://localhost:5000/uploads/articles/<file-name>`

Server now exposes uploads with:

- `app.use('/uploads', express.static(...))`

## Recommended usage by feature

- Landing page/profile/team visuals: static frontend assets in `client/public/static/images`.
- Rich article body images managed over time: backend uploads in `server/uploads/articles`.

## Authoring article HTML

In article content, prefer one of these URL styles:

1. Static image:

```html
<img src="/static/images/articles/digital-health-banner.svg" alt="Banner" />
```

2. Runtime uploaded image:

```html
<img src="http://localhost:5000/uploads/articles/hero-2026-03-10.jpg" alt="Banner" />
```

For production, replace host with your API domain (or CDN).

## Why this is optimal here

- Keeps UI assets simple and Git-tracked.
- Supports admin-managed article images without app rebuild.
- Works in local dev immediately with current stack.
- Easy future migration of `server/uploads` to S3/CDN.
