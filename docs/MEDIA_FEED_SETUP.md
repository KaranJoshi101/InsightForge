# Media Feed Feature - Quick Setup Guide

## Prerequisites

- Node.js and npm
- PostgreSQL database
- React frontend running on port 3000
- Express backend running on port 5000

## Backend Setup

### 1. Install Dependencies (if needed)

```bash
cd server
npm install axios  # For LinkedIn API calls (optional)
# axios should already be installed, but needed for linkedinIntegration.js
```

### 2. Database Migration

The database migration is automatically run when you initialize the database:

```bash
cd database
npm run init
```

This will:
- Create the `media_posts` table
- Create ENUM types: `media_size`, `media_source`
- Create necessary indexes
- Seed sample data (from `seed_media_posts.sql`)

### 3. Verify API Endpoints

Test the API:

```bash
# Get all media posts
curl http://localhost:5000/api/media

# Get with limit parameter
curl http://localhost:5000/api/media?limit=20

# Get specific post
curl http://localhost:5000/api/media/1
```

Expected response:
```json
{
  "posts": [
    {
      "id": 1,
      "title": "Post Title",
      "description": "Description",
      "image_url": "https://...",
      "size": "medium",
      "source": "manual",
      "created_at": "2026-03-25T..."
    }
  ],
  "count": 8
}
```

## Frontend Setup

### 1. Component Already Integrated

The MediaGrid component is already:
- Imported in LandingPage.js
- Added to the landing page as a new "Media Feed" section
- Styled with responsive CSS Grid

### 2. Verify Landing Page Integration

Navigate to the landing page:
- URL: http://localhost:3000/
- New "Media Feed" link in navbar and footer
- Grid should display with sample posts

### 3. Test Responsiveness

The grid is responsive across breakpoints:

| Screen Size | Grid Layout |
|------------|-------------|
| Desktop (> 1024px) | 4 columns, 200px height |
| Laptop (768-1024px) | 3 columns |
| Tablet (480-768px) | 2 columns, 250px height |
| Mobile (< 480px) | 1 column |

Resize browser to test responsive behavior.

## Manual Post Creation (Admin)

Create a post via API:

```bash
curl -X POST http://localhost:5000/api/media \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Research Highlight",
    "description": "Description of the post",
    "image_url": "https://example.com/image.jpg",
    "size": "medium",
    "source": "manual"
  }'
```

**Post Sizing:**
- `small`: 1x1 grid cell (200x200px on desktop)
- `medium`: 2x1 grid cells (400x200px on desktop) - DEFAULT
- `large`: 2x2 grid cells (400x400px on desktop)

## LinkedIn Integration (Optional)

### Prerequisites

1. LinkedIn API Access
   - Create app at https://www.linkedin.com/developers
   - Get access token through OAuth 2.0 flow

2. Profile URN
   - Format: `urn:li:person:XXXXX`
   - Get from LinkedIn API: `GET /v2/me`

### Environment Variables

Add to `.env`:

```env
# LinkedIn Integration (Optional)
LINKEDIN_ACCESS_TOKEN=your_access_token_here
LINKEDIN_PROFILE_URN=urn:li:person:123456789
```

### Sync LinkedIn Posts

Create a cron job or manual endpoint:

```javascript
// server/cron/syncLinkedIn.js (Example)
const { syncLinkedInPosts } = require('../utils/linkedinIntegration');
const mediaController = require('../controllers/mediaController');

// Manual sync (call via API)
app.post('/api/admin/sync-linkedin', authenticate, authorize, async (req, res) => {
    try {
        const result = await syncLinkedInPosts(
            mediaController,
            process.env.LINKEDIN_ACCESS_TOKEN,
            process.env.LINKEDIN_PROFILE_URN
        );
        res.json({ message: 'LinkedIn sync completed', result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

## Browser DevTools Testing

### Network Tab
- Monitor `/api/media` requests
- Verify response status (200 OK)
- Check image loading

### Console
- No errors related to MediaGrid
- Check for lazy-loading image logs

### Performance Tab
- Skeleton loader animation should be smooth
- Hover effects should not cause jank
- Grid should render within 16ms per frame

## Common Issues & Solutions

### Issue: "Failed to load media posts"
**Solution:**
1. Check backend is running (port 5000)
2. Verify `/api/media` endpoint responds
3. Check browser console for CORS errors
4. Verify database has media_posts table

### Issue: Images not showing
**Solution:**
1. Verify image URLs are publicly accessible
2. Check image_url is not NULL in database
3. Check for CORS issues in console
4. Try image in separate browser tab

### Issue: Grid not responsive
**Solution:**
1. Check browser window size
2. Clear browser cache (Ctrl+Shift+Del)
3. Verify MediaGrid.css is loaded
4. Check for conflicting CSS

### Issue: Skeleton loader loops infinitely
**Solution:**
1. Check backend API response
2. Verify network request completes
3. Check browser console for JavaScript errors

## Database Verification

```sql
-- Check if table exists and has data
SELECT COUNT(*) FROM media_posts;

-- View all posts
SELECT * FROM media_posts ORDER BY created_at DESC;

-- Check indexes
SELECT * FROM pg_indexes WHERE tablename = 'media_posts';

-- Verify enums
SELECT unnest(enum_range(NULL::media_size));
SELECT unnest(enum_range(NULL::media_source));
```

## Performance Tips

1. **Optimize Images**
   - Use WebP format or modern codecs
   - Compress to < 100KB per image
   - Use responsive image sizes

2. **Database**
   - Monitor query performance via EXPLAIN ANALYZE
   - Keep `limit` parameter reasonable
   - Consider pagination for >100 posts

3. **Frontend**
   - Lazy loading is automatic
   - Skeleton loader is performant (CSS-based)
   - Grid renders efficiently with CSS Grid

## Next Steps

1. **Add Admin Dashboard**
   - Create `/admin/media` page for post management
   - Form to create new posts
   - List view with edit/delete options

2. **Image Upload**
   - Replace image URLs with file upload
   - Store in `/uploads/media/` directory
   - Generate thumbnails

3. **LinkedIn Automation**
   - Set up cron job for auto-sync
   - Dashboard to trigger manual sync
   - Monitor sync history and errors

4. **Analytics**
   - Track views per post
   - Engagement metrics
   - Popular posts ranking

## File Checklist

Verify all files are in place:

- [x] `database/migrations/05_add_media_posts.sql`
- [x] `database/seeds/seed_media_posts.sql`
- [x] `database/init.js` (updated with new migration)
- [x] `server/controllers/mediaController.js`
- [x] `server/routes/media.js`
- [x] `server/utils/linkedinIntegration.js`
- [x] `server/index.js` (updated with media route)
- [x] `client/src/components/MediaGrid.jsx`
- [x] `client/src/components/MediaGrid.css`
- [x] `client/src/pages/LandingPage.js` (updated with import and section)
- [x] `client/src/pages/LandingPage.css` (updated with media-feed styles)
- [x] `docs/MEDIA_FEED_DOCUMENTATION.md`
- [x] `docs/MEDIA_FEED_SETUP.md` (this file)

## Support & Documentation

- Full documentation: [MEDIA_FEED_DOCUMENTATION.md](./MEDIA_FEED_DOCUMENTATION.md)
- API spec: Section 9 (API Catalog) in MASTER_PROJECT_DIAGRAM_SPEC.md
- Component props: JSDoc comments in MediaGrid.jsx

---

**Last Updated:** 2026-03-25  
**Version:** 1.0.0
