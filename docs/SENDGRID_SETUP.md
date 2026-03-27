# SendGrid Email Setup Guide

This guide walks you through setting up SendGrid for OTP and survey submission emails.

## Why SendGrid?

- **Free tier**: 100 emails/day
- **Reliable**: Works perfectly on Render (no firewall issues)
- **Pay-as-you-go**: Only $0.10 per 1,000 emails after free tier
- **Async**: Emails won't block your API responses

## Setup Steps

### 1. Create a SendGrid Account

1. Go to https://sendgrid.com/pricing
2. Click **"Sign Up"** → Choose Free Plan
3. Create account with your email
4. Verify your email address
5. Complete onboarding (takes ~5 minutes)

### 2. Generate API Key

1. Log in to SendGrid Dashboard
2. Left sidebar → **"Settings"** → **"API Keys"**
3. Click **"Create API Key"**
4. Name it: `survey-pro-api` (or any name)
5. Permissions: Choose **"Restricted Access"**
6. Select only **"Mail Send"** permission
7. Copy the API key (appears once, save it safely)

### 3. Add to Environment

#### Local Development (.env)

```env
SENDGRID_API_KEY=SG.your_api_key_here
```

#### Production (Render)

1. Go to your Render backend service dashboard
2. **Settings** → **Environment**
3. Add new variable:
   ```
   SENDGRID_API_KEY=SG.your_api_key_here
   ```
4. Click **Save** and **Redeploy**

### 4. Verify Sender Email

SendGrid requires sender verification. The system uses `SMTP_FROM_EMAIL`:

1. SendGrid Dashboard → **Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Email: `surveyproteam@gmail.com` (or your verified email)
4. Fill in Name, Company (can be anything)
5. Click link in verification email
6. Done!

### 5. Test It

1. Restart backend (local) or wait for Render redeploy
2. Try OTP signup at `/register`
3. Check backend logs:
   ```
   ✅ OTP email sent via SendGrid to user@example.com
   ```

## Fallback Behavior

If SendGrid fails or is not configured:
- System automatically tries SMTP (Gmail) as fallback
- If both fail, emails won't send but signup/submission still works

## Monitoring

Check SendGrid dashboard:
- **Activity** → See all sent emails
- **Settings → Suppressions** → View bounced/invalid addresses
- **API Integrations** → API usage stats

## Costs at Scale

| Volume | Monthly Cost |
|--------|--------------|
| 100/day | Free ($0) |
| 500/day | ~$1.50 |
| 1,000/day | ~$3 |
| 3,000/day | ~$9 |

All paid plans are **pay-as-you-go** with no monthly commitment.

## Troubleshooting

**"API key not working"**
- Make sure it starts with `SG.`
- Check for extra spaces in .env
- Redeploy after env var update

**"Emails not sending"**
- Verify sender email in SendGrid
- Check SendGrid activity log for errors
- Revoke and regenerate API key if stuck

**"Still using SMTP/Gmail"**
- Make sure `SENDGRID_API_KEY` is not empty
- Empty `SMTP_HOST` to disable SMTP fallback (not recommended)
- Check backend logs for which provider is used

## More Info

- SendGrid Docs: https://docs.sendgrid.com/
- API Reference: https://docs.sendgrid.com/api-reference/
- Support: https://support.sendgrid.com/
