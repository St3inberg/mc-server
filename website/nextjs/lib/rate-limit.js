// In-memory rate limiter — resets on server restart, fine for single-instance
const store = new Map();

export function makeRateLimiter({ windowMs, max }) {
  return function check(ip) {
    const now = Date.now();
    let record = store.get(ip);

    if (!record || now - record.start > windowMs) {
      record = { count: 0, start: now };
    }

    record.count++;
    store.set(ip, record);
    return record.count <= max;
  };
}

export function getIP(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '0.0.0.0'
  );
}

// Purge stale entries every 10 minutes
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [key, val] of store.entries()) {
    if (val.start < cutoff) store.delete(key);
  }
}, 10 * 60 * 1000);
