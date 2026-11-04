const crypto = require('crypto');

const SESSION_COOKIE = 'bd_session';
const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS || 24);
const SESSION_SECRET = process.env.SESSION_SECRET;

const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);

if (!SESSION_SECRET) {
  if (isProd) {
    throw new Error('SESSION_SECRET wajib diset di production. Tolak boot agar session tidak bisa dipalsukan.');
  }
  console.warn('WARNING: SESSION_SECRET is not set. Sessions will be insecure (dev only).');
}

function base64urlEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64urlDecode(input) {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(input.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf-8');
}

function sign(data) {
  const secret = SESSION_SECRET || '__insecure_dev_fallback__';
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function createSessionToken(user) {
  const payload = {
    sub: user.googleSub,
    exp: Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000
  };

  const payloadRaw = JSON.stringify(payload);
  const payloadEncoded = base64urlEncode(payloadRaw);
  const signature = sign(payloadEncoded);
  return `${payloadEncoded}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null;
  }

  const [payloadEncoded, signature] = token.split('.');
  if (!payloadEncoded || !signature) {
    return null;
  }

  const expected = sign(payloadEncoded);
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length || !crypto.timingSafeEqual(expectedBuf, signatureBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64urlDecode(payloadEncoded));
    if (!payload.sub || !payload.exp || payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function parseCookie(req, key) {
  const raw = req.headers.cookie;
  if (!raw) return null;

  const chunks = raw.split(';').map((s) => s.trim());
  const match = chunks.find((c) => c.startsWith(`${key}=`));
  if (!match) return null;
  return decodeURIComponent(match.slice(key.length + 1));
}

function setSessionCookie(res, token) {
  const maxAge = SESSION_TTL_HOURS * 60 * 60;
  const secure = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`
  ];

  if (secure) {
    parts.push('Secure');
  }

  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res) {
  const secure = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  const parts = [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0'
  ];

  if (secure) {
    parts.push('Secure');
  }

  res.setHeader('Set-Cookie', parts.join('; '));
}

function extractSessionPayload(req) {
  const token = parseCookie(req, SESSION_COOKIE);
  return verifySessionToken(token);
}

module.exports = {
  SESSION_COOKIE,
  createSessionToken,
  verifySessionToken,
  parseCookie,
  setSessionCookie,
  clearSessionCookie,
  extractSessionPayload
};
