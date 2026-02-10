const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'CHANGE_ME_ADMIN_TOKEN';
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK || null;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Simple SQLite DB
const db = new sqlite3.Database('./keys.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS keys (
    id TEXT PRIMARY KEY,
    key_code TEXT UNIQUE,
    created_at INTEGER,
    expires_at INTEGER,
    status TEXT,
    assigned_to TEXT,
    last_used INTEGER,
    use_count INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY,
    username TEXT,
    key_code TEXT,
    first_verified INTEGER,
    last_verified INTEGER,
    verification_count INTEGER DEFAULT 0,
    banned INTEGER DEFAULT 0
  )`);
});

function generateKeyCode() {
  const seg = () => Math.random().toString(36).substring(2, 6).toUpperCase().padEnd(4, 'X').slice(0,4);
  return `${seg()}-${seg()}-${seg()}-${seg()}`;
}

async function sendDiscordLog(title, description) {
  if (!DISCORD_WEBHOOK) return;
  try {
    await axios.post(DISCORD_WEBHOOK, {
      embeds: [{
        title: title,
        description: description,
        timestamp: new Date().toISOString()
      }]
    });
  } catch (err) {
    console.warn('Discord webhook failed', err.message);
  }
}

// Public: verify key
app.post('/verify-key', (req, res) => {
  const { key, userId, username } = req.body || {};
  if (!key || !userId) return res.status(400).json({ valid: false, error: 'missing key or userId' });

  const now = Math.floor(Date.now() / 1000);
  db.get('SELECT * FROM keys WHERE key_code = ? AND status = "active"', [key], (err, row) => {
    if (err) return res.status(500).json({ valid: false, error: 'db error' });
    if (!row) {
      sendDiscordLog('Key Verification Failed', `User: ${username || userId} attempted invalid key: ${key}`);
      return res.json({ valid: false });
    }

    if (row.expires_at && row.expires_at <= now) {
      return res.json({ valid: false, reason: 'expired' });
    }

    // check user ban
    db.get('SELECT banned FROM users WHERE user_id = ?', [userId], (uerr, urow) => {
      if (uerr) return res.status(500).json({ valid: false, error: 'db error' });
      if (urow && urow.banned === 1) return res.json({ valid: false, reason: 'banned' });

      // mark usage & upsert user
      db.run('UPDATE keys SET use_count = COALESCE(use_count,0) + 1, last_used = ?, assigned_to = COALESCE(assigned_to,?) WHERE id = ?', [now, userId, row.id]);

      db.get('SELECT * FROM users WHERE user_id = ?', [userId], (gerr, existing) => {
        if (gerr) return res.status(500).json({ valid: false, error: 'db error' });
        if (existing) {
          db.run('UPDATE users SET username = ?, last_verified = ?, verification_count = verification_count + 1 WHERE user_id = ?', [username || existing.username, now, userId]);
        } else {
          db.run('INSERT INTO users (user_id, username, key_code, first_verified, last_verified, verification_count) VALUES (?,?,?,?,?,?)', [userId, username || '', key, now, now, 1]);
        }

        sendDiscordLog('Key Verified', `User: ${username || userId} verified key ${key}`);
        return res.json({ valid: true, key: row.key_code, expires_at: row.expires_at });
      });
    });
  });
});

// Middleware for admin auth
function requireAdmin(req, res, next) {
  const token = req.headers['authorization'] ? req.headers['authorization'].replace(/^Bearer\s+/i, '') : req.headers['x-admin-token'];
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: 'unauthorized' });
  next();
}

// Admin: generate key
app.post('/admin/generate-key', requireAdmin, (req, res) => {
  const { days_valid, assigned_to } = req.body || {};
  const id = uuidv4();
  const code = generateKeyCode();
  const now = Math.floor(Date.now() / 1000);
  const expires_at = days_valid ? now + (parseInt(days_valid, 10) * 24 * 60 * 60) : null;
  db.run('INSERT INTO keys (id, key_code, created_at, expires_at, status, assigned_to, last_used, use_count) VALUES (?,?,?,?,?,?,?,?)', [id, code, now, expires_at, 'active', assigned_to || null, null, 0], function(err) {
    if (err) return res.status(500).json({ error: 'db error' });
    sendDiscordLog('Key Generated', `Key: ${code} expires: ${expires_at ? new Date(expires_at*1000).toISOString() : 'never'}`);
    res.json({ key: code, expires_at });
  });
});

app.get('/admin/keys', requireAdmin, (req, res) => {
  db.all('SELECT * FROM keys ORDER BY created_at DESC LIMIT 1000', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'db error' });
    res.json(rows || []);
  });
});

app.get('/admin/key/:key', requireAdmin, (req, res) => {
  const key = req.params.key;
  db.get('SELECT * FROM keys WHERE key_code = ?', [key], (err, row) => {
    if (err) return res.status(500).json({ error: 'db error' });
    if (!row) return res.status(404).json({ error: 'not found' });
    res.json(row);
  });
});

app.post('/admin/key/:key/revoke', requireAdmin, (req, res) => {
  const key = req.params.key;
  db.run('UPDATE keys SET status = "revoked" WHERE key_code = ?', [key], function(err) {
    if (err) return res.status(500).json({ error: 'db error' });
    sendDiscordLog('Key Revoked', `Key: ${key}`);
    res.json({ ok: true });
  });
});

app.post('/admin/user/:userId/ban', requireAdmin, (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  db.run('UPDATE users SET banned = 1 WHERE user_id = ?', [userId], function(err) {
    if (err) return res.status(500).json({ error: 'db error' });
    sendDiscordLog('User Banned', `User ID: ${userId}`);
    res.json({ ok: true });
  });
});

app.get('/admin/users', requireAdmin, (req, res) => {
  db.all('SELECT * FROM users ORDER BY last_verified DESC LIMIT 1000', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'db error' });
    res.json(rows || []);
  });
});

app.listen(PORT, () => {
  console.log(`Key server listening on ${PORT}`);
});
