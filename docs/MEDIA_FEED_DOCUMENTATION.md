# Media Feed Feature Documentation

## Overview

The Media Feed is a Pinterest-style responsive grid component that displays media posts on the landing page. It supports both manually added posts and posts synced from LinkedIn.

## Database

### Table: `media_posts`

```sql
CREATE TABLE media_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    size media_size DEFAULT 'medium',  -- 'small', 'medium', 'large'
    source media_source DEFAULT 'manual',  -- 'manual', 'linkedin'
    external_id VARCHAR(255) UNIQUE,  -- For tracking LinkedIn posts
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Enums

- **media_size**: `small` (1x1), `medium` (2x1), `large` (2x2)
- **media_source**: `manual`, `linkedin`

### Indexes

- `idx_media_posts_created_at`: For sorting by newest first
- `idx_media_posts_source`: For filtering by source
- `idx_media_posts_external_id`: For duplicate prevention

## Backend API

### Endpoint: GET /api/media

Fetch all media posts ordered by creation date (newest first).

**Query Parameters:**
- `limit` (optional, default: 50, max: 500) - Number of posts to return

**Response:**
```json
{
  "posts": [
    {
      "id": 1,
      "title": "Research Highlight",
      "description": "Long form description...",
      "image_url": "https://example.com/image.jpg",
      "size": "medium",
      "source": "linkedin",
      "created_at": "2026-03-25T10:00:00Z"
    }
  ],
  "count": 10
}
```

### Endpoint: POST /api/media (Admin Only)

Create a new media post manually.

**Request Body:**
```json
{
  "title": "Post Title",
  "description": "Optional description",
  "image_url": "https://example.com/image.jpg",
  "size": "medium",  // "small", "medium", or "large"
  "source": "manual"  // "manual" or "linkedin"
}
```

**Response:**
```json
{
  "message": "Media post created successfully",
  "post": { ... }
}
```

### Endpoint: GET /api/media/:id

Fetch a specific media post by ID.

### Endpoint: DELETE /api/media/:id (Admin Only)

Delete a media post by ID.

## Frontend

### Component: MediaGrid

**Location:** `client/src/components/MediaGrid.jsx`

**Props:**
```jsx
<MediaGrid 
  title="Media Feed"    // Optional section title
  limit={50}            // Max posts to fetch (default: 50)
/>
```

**Features:**
- Auto-fetch from GET /api/media on mount
- Responsive CSS Grid (4 columns → 2 columns → 1 column)
- Dynamic card sizing based on post.size
- Image lazy loading
- Skeleton loader during fetch
- Error handling with retry button
- Hover effects with zoom and overlay

**Integration:**
The component is integrated into the landing page with its own section between "Articles" and "Contact".

## Styling

### CSS Classes

- `.media-grid` - Main grid container
- `.media-card` - Individual card
- `.media-card-small/medium/large` - Grid sizing
- `.media-card-overlay` - Hover overlay
- `.source-badge` - Source indicator badge
- `.media-grid-skeleton` - Loading skeleton
- `.media-grid-empty` - Empty state
- `.media-grid-error` - Error state

### Responsive Breakpoints

| Breakpoint | Columns | Grid Gap |
|-----------|---------|----------|
| Desktop   | 4       | 16px     |
| Laptop    | 3       | 14px     |
| Tablet    | 2       | 12px     |
| Mobile    | 1       | 12px     |

### Theme Integration

Uses the landing page color scheme:
- Primary: `#003594` (Royal Blue)
- Accent: `#FFB81C` (Gold)
- Fonts: 'Merriweather' (headings), 'Source Sans Pro' (body)

## LinkedIn Integration

### Helper Functions

**Location:** `server/utils/linkedinIntegration.js`

```javascript
// Fetch posts from LinkedIn
const posts = await fetchLinkedInPosts(accessToken, profileUrn, limit);

// Normalize to media_posts format
const normalized = normalizeLinkedInPost(linkedInPost);

// Sync to database (avoid duplicates via external_id)
const result = await syncLinkedInPosts(mediaController, accessToken, profileUrn);
```

### Setup

1. **Get LinkedIn Access Token**
   - Create a LinkedIn App at developer.linkedin.com
   - Obtain user access token through OAuth flow
   - Store in environment variable: `LINKEDIN_ACCESS_TOKEN`

2. **Identify Profile URN**
   ```bash
   # Format: urn:li:person:XXXXX
   # Get from LinkedIn API: GET /v2/me
   ```

3. **Create Cron Job (Optional)**
   ```javascript
   // server/cron/syncLinkedIn.js
   const { CronJob } = require('cron');
   const { syncLinkedInPosts } = require('../utils/linkedinIntegration');
   
   const job = new CronJob('0 0 * * *', async () => {
     await syncLinkedInPosts(
       mediaController,
       process.env.LINKEDIN_ACCESS_TOKEN,
       process.env.LINKEDIN_PROFILE_URN
     );
   });
   
   job.start();
   ```

### Mock Data for Testing

```javascript
// Test without LinkedIn API
import { createMockLinkedInPost } from '../server/utils/linkedinIntegration';

const mockPost = createMockLinkedInPost(0);
// Returns normalized post with placeholder image
```

## Manual Post Submission

Admin users can manually add media posts via the API or admin dashboard (to be implemented):

```bash
curl -X POST http://localhost:5000/api/media \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Featured Research",
    "description": "New findings...",
    "image_url": "https://example.com/img.jpg",
    "size": "large",
    "source": "manual"
  }'
```

## Performance Considerations

1. **Database Queries**
   - Always uses indexes on `created_at` for sorting
   - Limit query results with `limit` parameter
   - Consider pagination for very large datasets

2. **Image Optimization**
   - Lazy load images with `loading="lazy"`
   - Use optimized image URLs (compress, appropriate sizes)
   - Placeholder during load with shimmer animation

3. **Duplicate Prevention**
   - LinkedIn posts tracked by `external_id`
   - `ON CONFLICT (external_id) DO NOTHING` prevents duplicates
   - Manual posts don't require external_id

## Troubleshooting

### Images Not Loading
1. Check image_url is valid and publicly accessible
2. Verify CORS settings allow image domain
3. Check browser console for specific error

### Grid Layout Issues
- Ensure CSS Grid is supported (all modern browsers)
- Check for conflicting CSS rules
- Verify media-grid.css is loaded

### LinkedIn Sync Errors
1. Verify access token is valid
2. Check profile URN format
3. Review LinkedIn API rate limits
4. Check error logs for specific API responses

### Performance Issues
- Reduce `limit` parameter
- Optimize image sizes
- Use CDN for image delivery
- Consider pagination for large datasets

## Future Enhancements

- [ ] Admin dashboard for manual post creation UI
- [ ] Instagram API integration
- [ ] Twitter/X API integration
- [ ] Image upload instead of URL only
- [ ] Post scheduling/publishing dates
- [ ] Likes/engagement metrics
- [ ] Comments/discussion feature
- [ ] Search and filtering
- [ ] Analytics dashboard

## File Structure

```
server/
├── controllers/
│   └── mediaController.js
├── routes/
│   └── media.js
├── utils/
│   └── linkedinIntegration.js
└── ...

client/
├── src/
│   ├── components/
│   │   ├── MediaGrid.jsx
│   │   └── MediaGrid.css
│   ├── pages/
│   │   ├── LandingPage.js
│   │   └── LandingPage.css
│   └── ...
├── package.json
└── ...

database/
├── migrations/
│   └── 05_add_media_posts.sql
└── init.js
```

## License

Same as main project.
