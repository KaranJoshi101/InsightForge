# Static Image Assets

This folder stores frontend-served static images.

## Structure

- `profile/` - fixed profile and team photos used by landing/profile UI
- `articles/` - fixed article images referenced in article HTML content

## URL format (frontend)

Use root-relative URLs in content:

- `/static/images/profile/<file-name>`
- `/static/images/articles/<file-name>`

Example:

```html
<img src="/static/images/articles/digital-health-banner.svg" alt="Digital health" />
```

These files are bundled and served by the React app from `client/public`.
