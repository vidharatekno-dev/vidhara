const express = require('express');
const path = require('path');

const {
  configHandler,
  googleAuthHandler,
  meHandler,
  logoutHandler,
  usersHandler,
  healthHandler
} = require('./lib/handlers');
const { GOOGLE_CLIENT_ID } = require('./lib/config');

const app = express();

const PORT = Number(process.env.PORT || 3000);

// Header produksi tinggal di satu tempat (vercel.json) — dev server ikut memakainya
// agar pengujian lokal merepresentasikan perilaku di Vercel.
const vercelConfig = require('./vercel.json');
const HEADER_SOURCE_REGEX = {
  '/(.*)': /^\//,
  '/(assets|icons)/(.*)': /^\/(?:assets|icons)(?:\/.*)?$/,
  '/apple-touch-icon.png': /^\/apple-touch-icon\.png$/,
  '/(css|js)/(.*)': /^\/(?:css|js)(?:\/.*)?$/,
  '/manifest.webmanifest': /^\/manifest\.webmanifest$/,
  '/sw.js': /^\/sw\.js$/
};
const headerRules = vercelConfig.headers
  .filter((rule) => HEADER_SOURCE_REGEX[rule.source])
  .map((rule) => ({ regex: HEADER_SOURCE_REGEX[rule.source], headers: rule.headers }));
for (const rule of vercelConfig.headers) {
  if (!HEADER_SOURCE_REGEX[rule.source]) {
    console.warn(`Rule header vercel.json tidak dikenal di dev server: ${rule.source}`);
  }
}

app.use((req, res, next) => {
  for (const rule of headerRules) {
    if (!rule.regex.test(req.path)) continue;
    for (const { key, value } of rule.headers) {
      // Cache-Control tidak dipakai di dev agar iterasi CSS/JS selalu fresh;
      // nilai produksi tetap diatur oleh Vercel melalui vercel.json.
      if (key.toLowerCase() === 'cache-control') continue;
      if (key.toLowerCase() === 'content-type') {
        res.type('application/manifest+json');
      } else {
        res.setHeader(key, value);
      }
    }
  }
  next();
});

const rootDir = __dirname;
const publicDir = path.join(rootDir, 'public');

app.use(express.json({ limit: '1mb' }));

// Canonical redirect harus sebelum express.static agar tidak tersalip file statis.
app.get(['/privasi', '/privasi/'], (req, res) => {
  return res.redirect(301, '/privacy-policy');
});

app.use(express.static(publicDir, { extensions: ['html'] }));

app.get(['/karir', '/karir/'], (req, res) => {
  return res.sendFile(path.join(publicDir, 'karir.html'));
});

app.get(['/privacy-policy', '/privacy-policy/'], (req, res) => {
  return res.sendFile(path.join(publicDir, 'privacy-policy.html'));
});

app.get(['/terms-of-service', '/terms-of-service/'], (req, res) => {
  return res.sendFile(path.join(publicDir, 'terms-of-service.html'));
});

// Shared handlers (same code path as the Vercel serverless functions).
const wrap = (handler) => (req, res) => Promise.resolve(handler(req, res)).catch((err) => {
  console.error('Unhandled API error:', err.message);
  if (!res.headersSent) {
    res.status(500).json({ ok: false, message: 'Internal server error.' });
  }
});

app.get('/api/config', wrap(configHandler));
app.post('/api/auth/google', wrap(googleAuthHandler));
app.get('/api/auth/me', wrap(meHandler));
app.post('/api/auth/logout', wrap(logoutHandler));
app.get('/api/auth/users', wrap(usersHandler));
app.get('/api/health', wrap(healthHandler));

// Unknown API paths must 404, not fall through to the SPA HTML.
app.use('/api', (req, res) => {
  res.status(404).json({ ok: false, message: 'Endpoint tidak ditemukan.' });
});

// 404 sungguhan untuk route tak dikenal — bukan soft-404 berupa index.html,
// agar crawler tidak menganggap URL apa pun sebagai konten duplikat.
app.use((req, res) => {
  res.status(404).type('html').send(`<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>404 — Halaman tidak ditemukan | vidhara.id</title><style>body{background:#020617;color:#e2e8f0;font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}div{text-align:center;padding:2rem}h1{font-size:1.5rem;margin-bottom:.5rem}p{color:#94a3b8;margin-bottom:1.5rem}a{color:#a78bfa}</style></head><body><div><h1>404 — Halaman tidak ditemukan</h1><p>Halaman yang Anda cari tidak tersedia atau sudah dipindahkan.</p><a href="/">Kembali ke beranda vidhara.id</a></div></body></html>`);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  if (!GOOGLE_CLIENT_ID) {
    console.warn('GOOGLE_CLIENT_ID belum diset. Endpoint Google login belum aktif.');
  }
});

