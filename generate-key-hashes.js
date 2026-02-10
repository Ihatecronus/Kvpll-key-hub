#!/usr/bin/env node
/**
 * Generate key hashes for Luarmor-style key system
 * This converts plaintext keys into hashes for embedding in the Lua script
 * 
 * Usage:
 *   node generate-key-hashes.js "5367B55B" "CB3E57EC" "ANOTHER_KEY"
 *   Or it fetches from API:
 *   node generate-key-hashes.js --fetch
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'https://key-hub--kvpll.replit.app';
const ADMIN_TOKEN = 'AjgHTvmQXD4Iq72hQ2cBIhZfGHJS1knb';
const LUA_FILE = path.join(__dirname, 'Evade_Hub_WITH_KEYSYSTEM.lua');

// We'll use lowercase key as the hash (same as what the Lua script will compare)
function generateKeyHash(key) {
    return key.toLowerCase();
}

function fetchKeysFromAPI() {
    return new Promise((resolve, reject) => {
        const url = new URL(`${API_URL}/api/admin/keys`);
        
        https.get(url, {
            headers: {
                'x-admin-token': ADMIN_TOKEN
            }
        }, (res) => {
            let data = '';
            
            res.on('data', chunk => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (!json.keys || !Array.isArray(json.keys)) {
                        throw new Error('Invalid API response');
                    }
                    
                    // Filter active (non-revoked) keys
                    const activeKeys = json.keys.filter(k => !k.isRevoked);
                    console.log(`✅ Fetched ${activeKeys.length} active keys`);
                    resolve(activeKeys.map(k => k.key));
                } catch (err) {
                    reject(err);
                }
            });
        }).on('error', reject);
    });
}

function updateLuaFile(keys) {
    if (!fs.existsSync(LUA_FILE)) {
        console.error(`❌ Lua file not found: ${LUA_FILE}`);
        process.exit(1);
    }

    // Read current Lua file
    let luaContent = fs.readFileSync(LUA_FILE, 'utf8');

    // Generate hash entries for each key
    const hashEntries = keys
        .map(key => `    ["${generateKeyHash(key)}"] = true,  -- ${key}`)
        .join('\n');

    // Generate replacement for KEY_HASHES table
    const newKeyHashesTable = `local KEY_HASHES = {
${hashEntries}
}`;

    // Find and replace the KEY_HASHES section
    const keyHashesRegex = /local KEY_HASHES = \{[\s\S]*?\}/;
    
    if (!keyHashesRegex.test(luaContent)) {
        console.error('❌ Could not find KEY_HASHES table in Lua file');
        process.exit(1);
    }

    luaContent = luaContent.replace(keyHashesRegex, newKeyHashesTable);

    // Write updated Lua file
    fs.writeFileSync(LUA_FILE, luaContent, 'utf8');
    
    console.log(`✅ Updated Lua file with ${keys.length} keys`);
}

async function main() {
    const args = process.argv.slice(2);

    let keys = [];

    if (args.includes('--fetch') || args.length === 0) {
        // Fetch from API
        console.log('📡 Fetching keys from API...');
        try {
            keys = await fetchKeysFromAPI();
        } catch (error) {
            console.error('❌ Failed to fetch keys from API:', error.message);
            console.error('Make sure the server is running and ADMIN_TOKEN is correct');
            process.exit(1);
        }
    } else {
        // Use provided keys
        keys = args;
        console.log(`📝 Using provided keys: ${keys.join(', ')}`);
    }

    if (keys.length === 0) {
        console.error('❌ No keys provided or fetched');
        process.exit(1);
    }

    console.log('\n🔐 Generating key hashes:');
    keys.forEach(key => {
        const hash = generateKeyHash(key);
        console.log(`  ${key} → ${hash}`);
    });

    console.log('\n📄 Updating Lua file...');
    updateLuaFile(keys);

    console.log('\n✨ Done! Your Lua script is now updated with the new keys.');
    console.log('💡 Tip: You can reload the script in-game to use the new keys.');
}

main();
