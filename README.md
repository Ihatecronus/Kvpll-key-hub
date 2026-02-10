# Evade Hub Key Server

This repository contains a simple Node.js + SQLite backend for managing keys used by the Evade Hub script.

Features:
- Generate keys with expiration
- Verify keys (tracks user id and username)
- Admin endpoints to list, revoke keys and ban users
- Optional Discord webhook logging

Environment variables:
- `PORT` (optional) — port to run the server (default 3000)
- `ADMIN_TOKEN` — admin secret token for protected endpoints (required)
- `DISCORD_WEBHOOK` — optional Discord webhook URL for logs

Quick start

1. Install dependencies

```bash
npm install
```

2. Set environment variables (example)

```bash
export ADMIN_TOKEN="your_admin_token_here"
export DISCORD_WEBHOOK="https://discord.com/api/webhooks/ID/TOKEN" # optional
node server.js
```

3. API endpoints

- `POST /verify-key` — body: `{ key, userId, username }` — returns `{ valid: true/false, expires_at }`
- `POST /admin/generate-key` — header `Authorization: Bearer <ADMIN_TOKEN>` body `{ days_valid, assigned_to }` — returns `{ key, expires_at }`
- `GET /admin/keys` — admin list keys
- `POST /admin/key/:key/revoke` — revoke key
- `POST /admin/user/:userId/ban` — ban user

Admin dashboard: you can use these endpoints to build a simple HTML admin UI.

If you want, I can run `npm install` here or add a simple admin HTML file.
