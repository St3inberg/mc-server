import jwt from 'jsonwebtoken';
import db from './db.js';

export function verifyAuth(request) {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    return db.prepare('SELECT * FROM users WHERE id = ?').get(payload.id) || null;
  } catch {
    return null;
  }
}

export function requireAuth(request) {
  const user = verifyAuth(request);
  if (!user) return { error: true, status: 401, body: { error: 'Unauthorized' } };
  return { user };
}

export function requireAdmin(request) {
  const user = verifyAuth(request);
  if (!user) return { error: true, status: 401, body: { error: 'Unauthorized' } };
  if (!user.is_admin) return { error: true, status: 403, body: { error: 'Forbidden' } };
  return { user };
}

export function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}
