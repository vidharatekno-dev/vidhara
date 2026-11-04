/**
 * Simple fixed-window in-memory rate limiter.
 * Per-instance only (serverless cold starts reset it), but it blunts the
 * most obvious brute-force/burst abuse without external infrastructure.
 */
const buckets = new Map();

/**
 * @param {string} key unique bucket key (e.g. ip + route)
 * @param {number} limit max requests per window
 * @param {number} windowMs window length in ms
 * @returns {boolean} true if the request is allowed
 */
function allow(key, limit, windowMs) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.start > windowMs) {
    buckets.set(key, { start: now, count: 1 });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= limit;
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) {
    return fwd.split(',')[0].trim();
  }
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

module.exports = { allow, clientIp };
