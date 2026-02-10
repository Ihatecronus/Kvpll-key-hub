# Railway Deployment Guide

## Quick Start

1. **Go to [Railway.app](https://railway.app)**
2. **Sign in with GitHub**
3. **Create new project → Deploy from GitHub repo**
4. **Select:** `BreezyFN420/Kvpll-key-hub`

## Setup Environment Variables

In Railway dashboard:
1. Go to your project → Variables
2. Add these variables:

```
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_WEBHOOK=your_webhook_url
ADMIN_CHANNEL_ID=your_channel_id
ADMIN_TOKEN=your_admin_token
PORT=3000
```

## Auto-Deployment

- Every push to `main` branch → Auto-deploys
- No manual builds needed
- Logs visible in Railway dashboard

## Custom Domain (Optional)

Railway provides a free `.railway.app` domain automatically.

To use a custom domain:
1. Go to Deployments tab
2. Click your deployment
3. Add custom domain

## Database

For persistence, Railway offers:
- PostgreSQL (free tier available)
- MongoDB
- MySQL

Your bot currently uses SQLite (`keys.db` in the container). For production, consider upgrading to PostgreSQL.

## Troubleshooting

**Bot not responding:**
- Check Railway logs for errors
- Verify Discord token in variables
- Check bot has proper permissions in Discord

**Port issues:**
- Railway auto-assigns PORT variable
- Server should listen on `process.env.PORT`

**Database issues:**
- SQLite files are lost when container restarts
- Use Railway's PostgreSQL for persistence

## Cost

- Free tier: $5 credit/month
- Perfect for one bot instance
- No credit card charge if within limits

## Next Steps

After deployment:
```bash
# Test the bot
!genkey 30

# Check API health
curl https://your-railway-url.railway.app/health
```

Your bot URL will be something like: `https://kvpll-keyhub.railway.app`
