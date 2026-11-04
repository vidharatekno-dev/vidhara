const fs = require('fs');
const path = require('path');
const { NODE_ENV } = require('./config');

const isVercel = Boolean(process.env.VERCEL);
const hasUpstash = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
const hasKv = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
let kvClient = null;
let upstashClient = null;

if (hasUpstash) {
  try {
    const { Redis } = require('@upstash/redis');
    upstashClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN
    });
  } catch (error) {
    console.warn('Upstash Redis package unavailable:', error.message);
  }
}

if (hasKv) {
  try {
    kvClient = require('@vercel/kv').kv;
  } catch (error) {
    console.warn('KV package unavailable, fallback non-persistent mode:', error.message);

// Cache for readUsers to reduce I/O
let usersCache = null;
const USERS_CACHE_TTL_MS = 5000; // 5 seconds

async function readUsers() {
  if (upstashClient) {
    const users = await upstashClient.get('google_users');
    return Array.isArray(users) ? users : [];
  }

  if (kvClient) {
    const users = await kvClient.get('google_users');
    return Array.isArray(users) ? users : [];
  }

  if (isVercel) {
    return usersMemory;
  }

  // Use cache if still valid
  if (usersCache && (Date.now() - usersCache.timestamp) < USERS_CACHE_TTL_MS) {
    return usersCache.data;
  }

  let result;
  if (!fs.existsSync(usersPath)) {
    result = [];
  } else {
    try {
      const raw = fs.readFileSync(usersPath, 'utf-8');
      const parsed = JSON.parse(raw);
      result = Array.isArray(parsed) ? parsed : [];
    } catch {
      result = [];
    }
  }

  // Update cache
  usersCache = { data: result, timestamp: Date.now() };
  return result;
}

async function writeUsers(users) {
  // Invalidate cache on write
  usersCache = null;

  if (upstashClient) {
    await upstashClient.set('google_users', users.slice(-MAX_STORED_USERS));
    return;
  }

  if (kvClient) {
    await kvClient.set('google_users', users.slice(-MAX_STORED_USERS));
    return;
  }

  if (isVercel) {
    if (users.length > MAX_MEMORY_USERS) {
      console.warn(`usersMemory exceeds limit (${users.length}/${MAX_MEMORY_USERS}). Oldest entries may be lost.`);
      // Keep only the most recent MAX_MEMORY_USERS users
      usersMemory = users.slice(-MAX_MEMORY_USERS);
    } else {
      usersMemory = users;
    }
    return;
  }

  const dir = path.dirname(usersPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Atomic write: write to temp file then rename to avoid corruption
  const tmpPath = usersPath + '.tmp';
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(users, null, 2), 'utf-8');
    fs.renameSync(tmpPath, usersPath);
  } catch (err) {
    console.error('Failed to write users file:', err.message);
    // Clean up temp file if it exists
    try { fs.unlinkSync(tmpPath); } catch {}
    throw new Error('Failed to save user data: ' + err.message);
  }
}

async function upsertUser(payload) {
  const users = await readUsers();
  const nowIso = new Date().toISOString();
  const idx = users.findIndex((u) => u.googleSub === payload.sub);

  if (idx >= 0) {
    const prev = users[idx];
    const next = {
      ...prev,
      name: payload.name || prev.name,
      email: payload.email || prev.email,
      picture: payload.picture || prev.picture,
      emailVerified: Boolean(payload.email_verified),
      lastSeenAt: nowIso,
      loginCount: Number(prev.loginCount || 0) + 1
    };
    users[idx] = next;
    await writeUsers(users);
    return next;
  }

  const user = {
    googleSub: payload.sub,
    email: payload.email || '',
    emailVerified: Boolean(payload.email_verified),
    name: payload.name || '',
    givenName: payload.given_name || '',
    familyName: payload.family_name || '',
    picture: payload.picture || '',
    locale: payload.locale || '',
    firstSeenAt: nowIso,
    lastSeenAt: nowIso,
    loginCount: 1
  };

  users.push(user);
  await writeUsers(users);
  return user;
}

async function getUserBySub(sub) {
  const users = await readUsers();
  return users.find((u) => u.googleSub === sub) || null;
}

module.exports = {
  readUsers,
  writeUsers,
  upsertUser,
  getUserBySub,
  isPersistent: Boolean(upstashClient || kvClient) || !isVercel,
  storageMode: upstashClient ? 'upstash-redis' : (kvClient ? 'kv' : (isVercel ? 'memory' : 'file')),
  MAX_MEMORY_USERS,
  MAX_STORED_USERS,
  NODE_ENV
};

  }
}

const usersPath = path.join(process.cwd(), 'data', 'google-users.json');
let usersMemory = [];
const MAX_MEMORY_USERS = 10000; // Safety limit for Vercel memory mode
const MAX_STORED_USERS = 50000; // Safety cap for remote stores (avoids unbounded array growth)
