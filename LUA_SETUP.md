# Lua Script Configuration

## Setup Instructions

Your Lua script is now configured to use the Railway server for key validation.

### 1. Update Your Railway URL

Open `Evade_Hub_WITH_KEYSYSTEM.lua` and find line ~10:

```lua
local KEY_SERVER_URL = "https://your-railway-url.railway.app"
```

Replace with your actual Railway URL. You can find it in:
- Railway Dashboard → Your Project → Deployments → Domain

Example:
```lua
local KEY_SERVER_URL = "https://kvpll-keyhub.railway.app"
```

### 2. How the Key System Works

1. Player runs the script in their executor
2. Key system GUI appears
3. Player enters the key they got from `!genkey` in Discord
4. Script sends key to your Railway server for validation
5. Server checks if key is valid and not expired
6. If valid, Evade Hub loads; if invalid, user gets error

### 3. Key Features

- ✅ Server-based validation (always up-to-date)
- ✅ Automatic expiration checking
- ✅ Per-user tracking
- ✅ Ban checking
- ✅ Usage logging to Discord

### 4. Generate Keys for Users

In Discord, use:
```
!genkey 30      # Valid for 30 days
!genkey 7       # Valid for 7 days
!genkey 60      # Valid for 60 days
```

### 5. Testing

1. Use `!genkey 30` to create a test key
2. Run the Lua script in your executor
3. Enter the key when prompted
4. Should proceed to load Evade Hub

## Troubleshooting

**"Connection Error" message:**
- Check your Railway URL is correct
- Make sure Railway project is running
- Check that DISCORD_BOT_TOKEN is set in Railway

**"Invalid Key" message:**
- Key might be expired
- User might be banned
- Key doesn't exist in database

**"Key cannot be empty":**
- Player didn't enter a key

## Security Notes

- Keys are sent over HTTPS (Railway provides SSL by default)
- Database stores key hashes, not plain text
- Each key can only be used by one player at a time
- Expired keys are rejected automatically
