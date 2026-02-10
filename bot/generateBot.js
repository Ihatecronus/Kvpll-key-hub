require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const BOT_TOKEN = process.env.BOT_TOKEN;
const API_URL = process.env.API_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN; // admin token for the key server
const ADMIN_DISCORD_ID = process.env.ADMIN_DISCORD_ID; // Discord user allowed to run commands

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN not set in environment');
  process.exit(1);
}
if (!ADMIN_TOKEN) {
  console.error('ADMIN_TOKEN not set in environment');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.on('ready', () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
  if (msg.author.bot) return;

  // restrict to admin Discord user if ADMIN_DISCORD_ID set
  if (ADMIN_DISCORD_ID && String(msg.author.id) !== String(ADMIN_DISCORD_ID)) return;

  const content = msg.content.trim();
  if (content.startsWith('!genkey')) {
    const parts = content.split(/\s+/);
    const days = parseInt(parts[1], 10) || 30;
    try {
      const r = await axios.post(`${API_URL}/api/admin/keys`, 
        { durationDays: days },
        { headers: { 'x-admin-token': ADMIN_TOKEN } }
      );
      const key = r.data.key;
      const expiresAt = r.data.expiresAt;
      msg.reply(`✅ Generated key: **${key}**\nExpires: ${expiresAt ? new Date(expiresAt).toUTCString() : 'never'}`);
    } catch (e) {
      console.error('generate-key error', e?.response?.data || e.message);
      msg.reply('❌ Failed to generate key:\n' + (e?.response?.data?.message || e.message));
    }
  }

  if (content.startsWith('!keys')) {
    try {
      const r = await axios.get(`${API_URL}/api/admin/keys`, { headers: { 'x-admin-token': ADMIN_TOKEN } });
      const keys = r.data.slice(0, 10).map(k => `${k.key} (${k.isRevoked ? 'revoked' : 'active'})`).join('\n') || 'no keys';
      msg.reply(`Recent keys:\n${keys}`);
    } catch (e) {
      console.error('!keys error', e?.response?.data || e.message);
      msg.reply('Failed to fetch keys.');
    }
  }
});

client.login(BOT_TOKEN).catch(err => {
  console.error('Failed to login bot:', err.message);
  process.exit(1);
});
