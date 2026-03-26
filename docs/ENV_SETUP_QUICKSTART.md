# Quick .env Setup Reference Card

## 30-Second Setup

### 1. Copy Template
```bash
cp .env.example .env
```

### 2. Fill Required Fields
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=survey_app

# Server
NODE_ENV=development
SERVER_PORT=5000
JWT_SECRET=<generate with: openssl rand -base64 32>

# Client
REACT_APP_API_URL=http://localhost:5000/api
CLIENT_URL=http://localhost:3000

# CORS
CORS_ORIGINS=http://localhost:3000
```

### 3. (Optional) Add LinkedIn
```env
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
LINKEDIN_ACCESS_TOKEN=your_access_token
LINKEDIN_PROFILE_URN=urn:li:person:123456789
```

---

## LinkedIn Credentials - Where to Get Them

### QUICK LOOKUP TABLE

| What | Where to Get | How Long Valid |
|-----|-------------|----------------|
| **Client ID** | https://www.linkedin.com/developers/apps → App settings | Doesn't expire |
| **Client Secret** | https://www.linkedin.com/developers/apps → App settings | Doesn't expire |
| **Access Token** | OAuth flow OR token generator | 2 months |
| **Profile URN** | `curl -H "Authorization: Bearer TOKEN" https://api.linkedin.com/v2/me` → Look for `id` field → `urn:li:person:{id}` | Until you regenerate token |

---

## Step-by-Step: Get LinkedIn Credentials

### Step 1: Create LinkedIn App (5 minutes)
```
1. Go to https://www.linkedin.com/developers/
2. Click "My apps" → "Create app"
3. Fill form: App name, LinkedIn Page, Logo
4. Check legal agreement
5. Wait for verification email (usually instant)
6. Verify your app
```

**Get from app settings:**
- Copy `Client ID`
- Copy `Client Secret`

### Step 2: Get Access Token (3 minutes)

**Option A: Use Test Token Generator** (easiest for testing)
```
1. Go to https://www.linkedin.com/developers/tools/member-permission-inspector
2. Select your app
3. Copy the generated access token
```

**Option B: OAuth Flow** (proper way)
```
1. Create authorization URL with your Client ID:
   https://www.linkedin.com/oauth/v2/authorization?client_id=123&redirect_uri=http://localhost:5000/callback&response_type=code&scope=r_basicprofile

2. User clicks link and approves
3. Get authorization code from redirect
4. Exchange code for token (backend will handle)
5. Copy access token from response
```

### Step 3: Get Profile URN (1 minute)

Using your access token:
```bash
curl -X GET https://api.linkedin.com/v2/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Look for `id` in response:
```json
{
  "id": "123456789",  // ← This is your ID
  ...
}
```

Your Profile URN is:
```
urn:li:person:123456789
```

---

## Adding to .env

### Complete LinkedIn Section (Copy & Paste)

```env
# ===== LINKEDIN INTEGRATION (OPTIONAL) =====
LINKEDIN_CLIENT_ID=your_client_id_here
LINKEDIN_CLIENT_SECRET=your_client_secret_here
LINKEDIN_ACCESS_TOKEN=AQVf...paste_token_here
LINKEDIN_PROFILE_URN=urn:li:person:123456789
```

---

## Verify Setup Works

### Test 1: Backend Can Read Variables
```bash
cd server
node -e "console.log(process.env.LINKEDIN_ACCESS_TOKEN ? '✅ Token loaded' : '❌ Missing')"
```

Expected: `✅ Token loaded`

### Test 2: API Endpoint Works
```bash
curl http://localhost:5000/api/media
```

Expected: JSON array of media posts

### Test 3: LinkedIn Sync Works (Admin only)
```bash
curl -X POST http://localhost:5000/api/admin/sync-linkedin \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Expected: `inserted: X, skipped: 0`

---

## Common Mistakes & Fixes

| Problem | Cause | Fix |
|---------|-------|-----|
| "LINKEDIN_ACCESS_TOKEN is not defined" | .env not loaded | Use `require('dotenv').config()` in server/index.js |
| "invalid_request" error | Wrong token format | Ensure token starts with `AQVf` or similar |
| "unauthorized_client" error | Wrong Client ID/Secret | Copy directly from app settings |
| "Token expired" error | Token older than 2 months | Regenerate using token generator or OAuth |
| Empty `id` in API response | Public API scope not granted | Add `r_basicprofile` to OAuth scopes |

---

## Security Checklist

- [ ] .env file is in .gitignore
- [ ] Don't commit .env to git
- [ ] Client Secret never shared
- [ ] Access Token not logged
- [ ] Different tokens for dev/prod
- [ ] Invalid tokens cleaned up regularly
- [ ] Use secrets manager in production

---

## Files You Need to Edit

```
survey-app/
├── .env  ← YOU EDIT THIS FILE (created from .env.example)
├── server/
│   ├── index.js  ← Should have: require('dotenv').config()
│   └── utils/linkedinIntegration.js  ← Uses LINKEDIN_* variables
├── client/
│   └── .env  ← Optional, for REACT_APP_* variables
└── docs/
    ├── LINKEDIN_SETUP.md  ← Full detailed guide
    └── MEDIA_FEED_SETUP.md  ← Feature setup guide
```

---

## One-Command Setup

If you have all credentials ready:

```bash
# Backend .env
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=survey_app
NODE_ENV=development
SERVER_PORT=5000
JWT_SECRET=$(openssl rand -base64 32)
REACT_APP_API_URL=http://localhost:5000/api
CLIENT_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:3000
LINKEDIN_CLIENT_ID=your_id
LINKEDIN_CLIENT_SECRET=your_secret
LINKEDIN_ACCESS_TOKEN=your_token
LINKEDIN_PROFILE_URN=urn:li:person:123456789
EOF

# Check it worked
cat .env
```

---

## Need Help?

1. **Full LinkedIn Guide:** See `docs/LINKEDIN_SETUP.md`
2. **Media Feed Setup:** See `docs/MEDIA_FEED_SETUP.md`
3. **All Error Messages:** See troubleshooting section in LINKEDIN_SETUP.md
4. **Production Deployment:** Use AWS Secrets Manager or similar instead of .env

---

**Last Updated:** 2026-03-25  
**Time to Complete:** 10-15 minutes  
**Difficulty:** Beginner-friendly
