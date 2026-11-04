/* ============================================================
   Smoke & regression test untuk site Vidhara (server.js Express).
   Jalankan: npm test  (node --test, tanpa dependensi tambahan)
   ============================================================ */

const test = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

const PORT = 3457;
const BASE = `http://127.0.0.1:${PORT}`;
let serverProcess;

test.before(async () => {
  serverProcess = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT: String(PORT), SESSION_SECRET: 'test-secret-for-node-test-0123456789' },
    stdio: 'ignore'
  });
  // Tunggu server siap
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return;
    } catch { /* belum siap */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Server tidak merespons setelah 10 detik');
});

test.after(() => {
  if (serverProcess) serverProcess.kill();
});

async function get(pathname) {
  const res = await fetch(`${BASE}${pathname}`);
  return { res, body: await res.text() };
}

/* ---------- Halaman publik ---------- */

test('GET / → 200 dengan metadata vidhara.id', async () => {
  const { res, body } = await get('/');
  assert.equal(res.status, 200);
  assert.match(body, /<title>[^<]*vidhara\.id<\/title>/);
  assert.match(body, /rel="canonical" href="https:\/\/www\.vidhara\.id\/"/);
  assert.match(body, /og:url" content="https:\/\/www\.vidhara\.id\/"/);
  assert.doesNotMatch(body, /builddigital\.space/);
});

test('Footer memiliki Privacy Policy dan Terms of Service yang terpisah', async () => {
  const { body } = await get('/');
  assert.match(body, /href="\/privacy-policy"[^>]*>Privacy Policy</);
  assert.match(body, /href="\/terms-of-service"[^>]*>Terms/);
});

test('GET /karir → 200, status ditutup, tanpa tautan Google Form', async () => {
  const { res, body } = await get('/karir');
  assert.equal(res.status, 200);
  assert.match(body, /Lowongan Ditutup/);
  assert.match(body, /Pendaftaran Ditutup/);
  assert.match(body, /Kebijakan Privasi Vidhara/);
  assert.match(body, /Google Forms dan mungkin memerlukan login akun Google/);
  assert.doesNotMatch(body, /docs\.google\.com\/forms/);
});

test('GET /privacy-policy → 200 dengan canonical khusus', async () => {
  const { res, body } = await get('/privacy-policy');
  assert.equal(res.status, 200);
  assert.match(body, /rel="canonical" href="https:\/\/www\.vidhara\.id\/privacy-policy"/);
  assert.match(body, /Kebijakan Privasi/);
  assert.doesNotMatch(body, /<h2[^>]*>Syarat &amp; Ketentuan/);
});

test('GET /terms-of-service → 200 dan bukan redirect ke privacy-policy', async () => {
  const { res, body } = await get('/terms-of-service');
  assert.equal(res.status, 200);
  assert.match(body, /rel="canonical" href="https:\/\/www\.vidhara\.id\/terms-of-service"/);
  assert.match(body, /Syarat/);
});

test('Redirect lama /privasi → /privacy-policy', async () => {
  const res = await fetch(`${BASE}/privasi`, { redirect: 'manual' });
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('location'), '/privacy-policy');
});

/* ---------- PWA ---------- */

test('Manifest → 200, brand Vidhara, ikon terdaftar', async () => {
  const { res, body } = await get('/manifest.webmanifest');
  assert.equal(res.status, 200);
  const manifest = JSON.parse(body);
  assert.match(manifest.name, /vidhara\.id/);
  assert.equal(manifest.short_name, 'Vidhara');
  const icons = manifest.icons.map((i) => i.src);
  for (const expected of ['/icons/icon-192.png', '/icons/icon-512.png', '/icons/icon-maskable-512.png']) {
    assert.ok(icons.includes(expected), `ikon ${expected} tidak ada di manifest`);
  }
});

test('Semua ikon PWA tersaji 200 dengan dimensi yang benar', async () => {
  const expected = {
    '/icons/icon-192.png': 192,
    '/icons/icon-512.png': 512,
    '/icons/icon-maskable-512.png': 512,
    '/apple-touch-icon.png': 180
  };
  for (const [file, size] of Object.entries(expected)) {
    const res = await fetch(`${BASE}${file}`);
    assert.equal(res.status, 200, `${file} harus 200`);
    assert.equal(res.headers.get('content-type'), 'image/png');
    const body = Buffer.from(await res.arrayBuffer());
    // PNG IHDR: width pada byte 16-19, height 20-23 (big-endian)
    assert.equal(body.readUInt32BE(16), size, `lebar ${file}`);
    assert.equal(body.readUInt32BE(20), size, `tinggi ${file}`);
  }
});

test('Service worker memuat semua halaman + ikon di precache', async () => {
  const { res, body } = await get('/sw.js');
  assert.equal(res.status, 200);
  for (const url of ['/terms-of-service', '/privacy-policy', '/icons/icon-192.png', '/icons/icon-maskable-512.png']) {
    assert.ok(body.includes(`'${url}'`), `precache tidak memuat ${url}`);
  }
});

/* ---------- API ---------- */

test('GET /api/config → 200 dan hanya berisi konfigurasi publik', async () => {
  const { res, body } = await get('/api/config');
  assert.equal(res.status, 200);
  const data = JSON.parse(body);
  const allowedKeys = ['ok', 'googleClientIdConfigured', 'googleClientId', 'at'];
  for (const key of Object.keys(data)) {
    assert.ok(allowedKeys.includes(key), `field tidak terduga di /api/config: ${key}`);
  }
});

test('GET /api/auth/me tanpa sesi → 401 (bukan 404)', async () => {
  const res = await fetch(`${BASE}/api/auth/me`);
  assert.equal(res.status, 401);
});

/* ---------- Header keamanan ---------- */

test('Respons HTML membawa security headers', async () => {
  const { res } = await get('/');
  assert.ok(res.headers.get('content-security-policy'), 'CSP tidak ada');
  assert.match(res.headers.get('content-security-policy'), /frame-ancestors 'none'/);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('x-frame-options'), 'DENY');
  assert.match(res.headers.get('referrer-policy'), /strict-origin/);
  assert.ok(res.headers.get('strict-transport-security'), 'HSTS tidak ada');
  assert.ok(res.headers.get('permissions-policy'));
});

/* ---------- SEO ---------- */

test('Sitemap dan robots memakai domain vidhara.id dan mencantumkan terms', async () => {
  const { body: sitemap } = await get('/sitemap.xml');
  assert.match(sitemap, /https:\/\/www\.vidhara\.id\/terms-of-service/);
  assert.match(sitemap, /https:\/\/www\.vidhara\.id\/privacy-policy/);
  assert.doesNotMatch(sitemap, /builddigital\.space/);
  const { body: robots } = await get('/robots.txt');
  assert.match(robots, /https:\/\/www\.vidhara\.id\/sitemap\.xml/);
  assert.doesNotMatch(robots, /builddigital\.space/);
});

test('Berkas sumber tidak lagi memuat brand lama builddigital.space', () => {
  const files = [
    'public/index.html',
    'public/karir.html',
    'public/privacy-policy.html',
    'public/terms-of-service.html',
    'public/manifest.webmanifest',
    'public/robots.txt',
    'public/sitemap.xml',
    'public/llms.txt',
    'public/sw.js'
  ];
  for (const file of files) {
    const content = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    assert.doesNotMatch(content, /builddigital\.space/, `${file} masih memuat brand lama`);
  }
});
