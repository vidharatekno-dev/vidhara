/**
 * Shared request handlers — single source of truth used by both the
 * Vercel serverless functions (api/*.js) and the Express dev server (server.js).
 */
const { OAuth2Client } = require('google-auth-library');
const { GOOGLE_CLIENT_ID, ADMIN_API_KEY, SESSION_TTL_HOURS } = require('./config');
const {
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  extractSessionPayload,
  safeEqual
} = require('./auth');
const { upsertUser, getUserBySub, readUsers, storageMode, isPersistent } = require('./storage');
const { allow, clientIp } = require('./rate-limit');

const oauthClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// Login attempts per IP: 10 per 5 minutes.
const LOGIN_RATE_LIMIT = 10;
const LOGIN_RATE_WINDOW_MS = 5 * 60 * 1000;
// Admin key attempts per IP: 5 per 5 minutes.
const ADMIN_RATE_LIMIT = 5;
const ADMIN_RATE_WINDOW_MS = 5 * 60 * 1000;

function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed);
  res.status(405).json({ ok: false, message: 'Method Not Allowed' });
}

async function configHandler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, 'GET');
  }

  res.status(200).json({
    ok: true,
    googleClientIdConfigured: Boolean(GOOGLE_CLIENT_ID),
    googleClientId: GOOGLE_CLIENT_ID || '',
    at: new Date().toISOString()
  });
}

function requireAdmin(req, res) {
  if (!ADMIN_API_KEY) {
    res.status(503).json({ ok: false, message: 'ADMIN_API_KEY belum diset di environment.' });
    return false;
  }

  const ip = clientIp(req);
  if (!allow(`admin:${ip}`, ADMIN_RATE_LIMIT, ADMIN_RATE_WINDOW_MS)) {
    res.status(429).json({ ok: false, message: 'Terlalu banyak percobaan. Coba lagi nanti.' });
    return false;
  }

  // req.get() tidak tersedia di runtime serverless Vercel — cukup baca headers.
  const key = req.headers['x-admin-key'];
  if (!key || !safeEqual(ADMIN_API_KEY, key)) {
    res.status(401).json({ ok: false, message: 'Unauthorized admin key.' });
    return false;
  }

  return true;
}

async function googleAuthHandler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, 'POST');
  }

  if (!GOOGLE_CLIENT_ID || !oauthClient) {
    res.status(503).json({ ok: false, message: 'GOOGLE_CLIENT_ID belum diset di environment Vercel.' });
    return;
  }

  const ip = clientIp(req);
  if (!allow(`login:${ip}`, LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW_MS)) {
    res.status(429).json({ ok: false, message: 'Terlalu banyak percobaan login. Coba lagi nanti.' });
    return;
  }

  const idToken = req.body?.id_token;
  if (!idToken) {
    res.status(400).json({ ok: false, message: 'id_token wajib diisi.' });
    return;
  }

  try {
    const ticket = await oauthClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();

    if (!payload?.sub) {
      res.status(401).json({ ok: false, message: 'Token Google tidak valid.' });
      return;
    }

    const user = await upsertUser(payload);
    const token = createSessionToken(user);
    setSessionCookie(res, token);

    if (!isPersistent) {
      console.warn(`Login tersimpan di storage non-persisten (mode: ${storageMode}). Data bisa hilang saat instance berganti.`);
    }

    res.status(200).json({
      ok: true,
      user,
      persistent: isPersistent,
      sessionExpiresAt: new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Google token verification failed:', error?.message || error);
    res.status(401).json({ ok: false, message: 'Verifikasi token Google gagal.' });
  }
}

async function meHandler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, 'GET');
  }

  const session = extractSessionPayload(req);
  if (!session?.sub) {
    res.status(401).json({ ok: false, message: 'Belum login.' });
    return;
  }

  const user = await getUserBySub(session.sub);
  if (!user) {
    res.status(401).json({ ok: false, message: 'Session user tidak ditemukan.' });
    return;
  }

  res.status(200).json({
    ok: true,
    user,
    sessionExpiresAt: new Date(session.exp).toISOString()
  });
}

function logoutHandler(req, res) {
  if (req.method !== 'POST') {
    return methodNotAllowed(res, 'POST');
  }

  clearSessionCookie(res);
  res.status(200).json({ ok: true });
}

async function usersHandler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, 'GET');
  }

  if (!requireAdmin(req, res)) {
    return;
  }

  const users = await readUsers();
  const sorted = [...users].sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());

  res.status(200).json({ ok: true, total: sorted.length, users: sorted });
}

function healthHandler(req, res) {
  if (req.method !== 'GET') {
    return methodNotAllowed(res, 'GET');
  }

  // Storage details are only exposed to authenticated admins to avoid
  // leaking infrastructure information publicly.
  const body = { ok: true, service: 'google-auth', at: new Date().toISOString() };
  // req.get() tidak tersedia di runtime serverless Vercel — cukup baca headers.
  const key = req.headers['x-admin-key'];
  if (ADMIN_API_KEY && key && safeEqual(ADMIN_API_KEY, key)) {
    body.storageMode = storageMode;
    body.isPersistent = isPersistent;
  }

  res.status(200).json(body);
}

module.exports = {
  configHandler,
  googleAuthHandler,
  meHandler,
  logoutHandler,
  usersHandler,
  healthHandler,
  requireAdmin
};
