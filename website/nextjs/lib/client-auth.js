'use client';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nt_token');
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('nt_user') || 'null'); } catch { return null; }
}

export function setAuth(token, user) {
  localStorage.setItem('nt_token', token);
  localStorage.setItem('nt_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('nt_token');
  localStorage.removeItem('nt_user');
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    clearAuth();
    window.location.href = '/login';
    return null;
  }
  return res;
}
