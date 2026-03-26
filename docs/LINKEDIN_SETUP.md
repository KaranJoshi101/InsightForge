# LinkedIn Integration Setup Guide

Complete step-by-step guide to generate LinkedIn credentials and configure the .env file for the Media Feed feature.

## Table of Contents
1. [Create LinkedIn App](#create-linkedin-app)
2. [Get Access Token](#get-access-token)
3. [Get Profile URN](#get-profile-urn)
4. [Configure .env](#configure-env)
5. [Test LinkedIn Integration](#test-linkedin-integration)

---

## Create LinkedIn App

### Step 1: Go to LinkedIn Developer Portal

1. Open https://www.linkedin.com/developers/
2. Sign in with your LinkedIn account (create one if needed)
3. Click **"My apps"** or **"Create app"** button

### Step 2: Complete App Registration Form

Fill in the following details:

| Field | Example Value |
|-------|---------------|
| **App name** | SurveyPro Media Feed |
| **LinkedIn Page** | Your professional page or create new |
| **App logo** | Your company/project logo |
| **Legal agreement** | Check the box |
| **App uses** | Marketing/Research/Content |

### Step 3: Verify & Confirm

- Review the terms
- Click **"Create app"**
- LinkedIn will send a verification email — **click the link to approve**

### Step 4: Get App Credentials

Once approved, navigate to **App settings**:

```
https://www.linkedin.com/developers/apps
```

You'll see:
- **Client ID** (also called Application ID)
- **Client Secret** — Keep this **PRIVATE**

Save these somewhere secure:
```env
LINKEDIN_CLIENT_ID=1234567890123456
LINKEDIN_CLIENT_SECRET=abcdefghijklmnopqrstuvwxyz
```

---

## Get Access Token

### Option A: OAuth 2.0 Flow (Recommended for Web Apps)

The OAuth flow allows users to authorize your app once, then you get a long-lived token.

#### Step 1: Authorize User

Create an authorization URL with this format:

```
https://www.linkedin.com/oauth/v2/authorization?
  client_id=YOUR_CLIENT_ID
  &redirect_uri=http://localhost:5000/api/linkedin/callback
  &response_type=code
  &scope=r_basicprofile,r_emailaddress,w_member_social
  &state=random_string
```

**Replace:**
- `YOUR_CLIENT_ID` - from app settings
- `redirect_uri` - must be whitelisted in app settings

#### Step 2: User Clicks Link

User logs in and grants permissions. LinkedIn redirects to:

```
http://localhost:5000/api/linkedin/callback?code=AUTHORIZATION_CODE&state=random_string
```

#### Step 3: Exchange Code for Access Token

Make a POST request from your backend:

```bash
curl -X POST https://www.linkedin.com/oauth/v2/accessToken \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=AUTHORIZATION_CODE" \
  -d "redirect_uri=http://localhost:5000/api/linkedin/callback" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

Response:
```json
{
  "access_token": "AQVf...",
  "expires_in": 5183944,
  "refresh_token": "AQW...",
  "refresh_token_expires_in": 31536000
}
```

Save the `access_token` in .env:
```env
LINKEDIN_ACCESS_TOKEN=AQVf...
```

### Option B: Direct Token (For Testing/Development Only)

**⚠️ NOT RECOMMENDED for production**

Some LinkedIn API tools allow generating manual tokens:

1. Go to your app settings
2. Under **"Auth"** or **"Authorized redirect URLs"**, add:
   ```
   http://localhost:5000/api/linkedin/callback
   ```
3. Use tools like:
   - [LinkedIn Token Generator](https://www.linkedin.com/oauth/v2/testTokenGenerator)
   - Postman with OAuth 2.0 setup
   - Dev tools in your IDE

**Validity:** Usually 2 months, then expires

---

## Get Profile URN

### Option A: From /v2/me API Endpoint

Using your access token, make a request:

```bash
curl -X GET https://api.linkedin.com/v2/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "X-Restli-Protocol-Version: 2.0.0"
```

Response:
```json
{
  "localizedFirstName": "Manoj",
  "localizedLastName": "Kumar",
  "id": "123456789",
  "profilePicture": { ... }
}
```

Your **Profile URN** is:
```
urn:li:person:123456789
```

### Option B: From LinkedIn URL

If you have the profile URL:
```
https://www.linkedin.com/in/drmanojkumardiwakarstatisticianprofessoratjnu/
```

Extract the public ID from the URL, then use the API to get the URN.

### Option C: Using LinkedIn ID Decoder

Some tools convert LinkedIn IDs to URNs:
- [LinkedIn ID Decoder](https://www.linkedin.com/developers/tools/member-permission-inspector)
- Or manually format as: `urn:li:person:YOUR_NUMERIC_ID`

Save in .env:
```env
LINKEDIN_PROFILE_URN=urn:li:person:123456789
```

---

## Configure .env

### Create/Update .env File

Navigate to project root:
```bash
cd survey-app
```

Create or edit `.env`:
```bash
nano .env
# or use your editor
```

### Add LinkedIn Variables

```env
# ===== LINKEDIN INTEGRATION (OPTIONAL) =====
LINKEDIN_CLIENT_ID=1234567890123456
LINKEDIN_CLIENT_SECRET=abcdefghijklmnopqrstuvwxyz
LINKEDIN_ACCESS_TOKEN=AQVf...
LINKEDIN_PROFILE_URN=urn:li:person:123456789

# Optional: LinkedIn API version (default: 202401)
LINKEDIN_API_VERSION=202401

# Optional: Token refresh URL (for production)
LINKEDIN_REFRESH_TOKEN=AQW...
```

### Full .env Example (All Variables)

```env
# ===== DATABASE =====
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=survey_app

# ===== SERVER =====
NODE_ENV=development
SERVER_PORT=5000
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_required

# ===== CLIENT =====
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_VERSION=1.0.0

# ===== CORS & SECURITY =====
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
CLIENT_URL=http://localhost:3000

# ===== LINKEDIN INTEGRATION (OPTIONAL) =====
LINKEDIN_CLIENT_ID=1234567890123456
LINKEDIN_CLIENT_SECRET=abcdefghijklmnopqrstuvwxyz
LINKEDIN_ACCESS_TOKEN=AQVf...
LINKEDIN_PROFILE_URN=urn:li:person:123456789
LINKEDIN_API_VERSION=202401
LINKEDIN_REFRESH_TOKEN=AQW...
```

### Where to Place .env

```
survey-app/
├── .env                    # Backend .env (server directory or root)
├── client/
│   ├── .env               # Frontend .env (optional)
│   └── .env.local         # Frontend local overrides (optional)
├── server/
│   └── (uses parent .env)
└── ...
```

**Note:** Backend server can read from either:
1. `survey-app/.env` (root level)
2. `survey-app/server/.env` (server specific)

Frontend reads from:
1. `survey-app/client/.env` (committed defaults)
2. `survey-app/client/.env.local` (git-ignored local overrides)

---

## Test LinkedIn Integration

### Step 1: Verify .env Is Loaded

In `server/index.js` or `server/utils/linkedinIntegration.js`:

```javascript
console.log('LinkedIn Access Token:', process.env.LINKEDIN_ACCESS_TOKEN ? '✅ Set' : '❌ Missing');
console.log('LinkedIn Profile URN:', process.env.LINKEDIN_PROFILE_URN ? '✅ Set' : '❌ Missing');
```

### Step 2: Test API Endpoint

```bash
curl -X GET http://localhost:5000/api/media \
  -H "Content-Type: application/json"
```

Should return media posts (empty array initially if no LinkedIn sync done yet).

### Step 3: Manual Sync Test

Create an admin endpoint to test LinkedIn sync:

```javascript
// server/routes/media.js (add this route)
router.post('/admin/sync-linkedin', authenticate, authorize, async (req, res) => {
    try {
        const { syncLinkedInPosts } = require('../utils/linkedinIntegration');
        const result = await syncLinkedInPosts(
            mediaController,
            process.env.LINKEDIN_ACCESS_TOKEN,
            process.env.LINKEDIN_PROFILE_URN
        );
        res.json({
            message: 'LinkedIn sync completed',
            result
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

Test with:

```bash
curl -X POST http://localhost:5000/api/admin/sync-linkedin \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Step 4: Check Logs

When syncing, you should see:

```
[LinkedIn] Fetching posts for profile...
[LinkedIn] Fetched and normalized X posts
[LinkedIn Sync] Inserted: X, Skipped (duplicates): 0
```

If errors appear, check:
1. Access token is valid (not expired)
2. Profile URN is correct
3. LinkedIn API scope permissions

---

## Troubleshooting

### "unauthorized_client" Error

**Cause:** Client ID or Secret is wrong, or app not verified

**Fix:**
1. Double-check credentials in app settings
2. Ensure redirect URI is whitelisted
3. Wait for LinkedIn verification email

### "invalid_request" Error

**Cause:** Missing required scope or malformed request

**Fix:**
1. Ensure scope includes: `r_basicprofile,r_emailaddress,w_member_social`
2. Check access token format (should start with `AQV...`)
3. Verify API version is supported

### "Access Token Expired" Error

**Cause:** Token older than 2 months

**Fix:**
1. Regenerate access token via OAuth flow
2. Implement refresh token rotation
3. Store refresh token in .env and use it to get new access token

### Media Posts Not Syncing

**Cause:** Various LinkedIn API issues

**Debug:**
```javascript
// Add detailed logging in linkedinIntegration.js
console.log('Request headers:', headers);
console.log('Response status:', response.status);
console.log('Response body:', response.data);
```

### Timeout Errors

**Cause:** LinkedIn API slow or unreachable

**Fix:**
1. Add timeout to axios:
```javascript
const api = axios.create({
    timeout: 10000, // 10 seconds
    baseURL: LINKEDIN_API_BASE,
});
```

---

## Security Best Practices

### ✅ DO

- ✅ Store `CLIENT_SECRET` and `ACCESS_TOKEN` in .env (never commit)
- ✅ Use `.env.local` for local testing
- ✅ Rotate access tokens periodically
- ✅ Use HTTPS in production
- ✅ Implement rate limiting on sync endpoint
- ✅ Log sensitive data minimally

### ❌ DON'T

- ❌ Commit .env file to git
- ❌ Hardcode credentials in code
- ❌ Share access tokens in logs
- ❌ Use the same token for multiple environments
- ❌ Grant unnecessary LinkedIn API scopes

### .gitignore Sample

```
# Environment
.env
.env.local
.env.*.local

# Dependencies
node_modules/

# Builds
/build
/dist

# Logs
*.log
npm-debug.log*
```

---

## Production Considerations

### Refresh Token Rotation

LinkedIn access tokens expire after 2 months. For production:

```javascript
// Implement refresh logic
if (tokenExpired(process.env.LINKEDIN_ACCESS_TOKEN)) {
    const newToken = await refreshLinkedInToken(
        process.env.LINKEDIN_REFRESH_TOKEN,
        process.env.LINKEDIN_CLIENT_ID,
        process.env.LINKEDIN_CLIENT_SECRET
    );
    
    // Update .env or secrets manager
    process.env.LINKEDIN_ACCESS_TOKEN = newToken;
}
```

### Use Secrets Manager

Instead of .env in production, use:
- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Azure Key Vault**
- **Vercel Secrets** (if deployed there)

Example with AWS:

```javascript
const { SecretsManager } = require('aws-sdk');
const sm = new SecretsManager();

const secret = await sm.getSecretValue({ 
    SecretId: 'linkedin/access-token' 
}).promise();

const { LINKEDIN_ACCESS_TOKEN } = JSON.parse(secret.SecretString);
```

### Cron Job for Auto-Sync

Schedule LinkedIn post syncing:

```javascript
// server/cron/syncLinkedInPosts.js
const { CronJob } = require('cron');
const { syncLinkedInPosts } = require('../utils/linkedinIntegration');

// Sync every day at 9 AM
const job = new CronJob('0 9 * * *', async () => {
    console.log('[Cron] Starting LinkedIn sync at', new Date());
    try {
        const result = await syncLinkedInPosts(
            mediaController,
            process.env.LINKEDIN_ACCESS_TOKEN,
            process.env.LINKEDIN_PROFILE_URN
        );
        console.log('[Cron] Sync completed:', result);
    } catch (error) {
        console.error('[Cron] Sync failed:', error.message);
        // Send alert/email notification
    }
});

job.start();
```

---

## Quick Reference

| Variable | Required | Example | Source |
|----------|----------|---------|--------|
| `LINKEDIN_CLIENT_ID` | Optional | `1234567890123456` | App settings |
| `LINKEDIN_CLIENT_SECRET` | Optional | `abcdefg...` | App settings |
| `LINKEDIN_ACCESS_TOKEN` | Optional | `AQVf...` | OAuth flow result |
| `LINKEDIN_PROFILE_URN` | Optional | `urn:li:person:123` | `/v2/me` API |
| `LINKEDIN_API_VERSION` | Optional | `202401` | Default value |
| `LINKEDIN_REFRESH_TOKEN` | Optional | `AQW...` | OAuth flow result |

---

## Next Steps

1. ✅ Create LinkedIn app at https://www.linkedin.com/developers/
2. ✅ Generate access token via OAuth flow
3. ✅ Get profile URN from API
4. ✅ Add credentials to `.env`
5. ✅ Test API endpoint
6. ✅ Set up cron job for auto-sync (optional)
7. ✅ Deploy to production with secrets manager

---

**Last Updated:** 2026-03-25  
**Version:** 1.0.0
