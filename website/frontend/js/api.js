const API_BASE = '/api';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('netztech_token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(API_BASE + path, { ...options, headers });
    if (res.status === 401) {
      localStorage.clear();
      window.location.href = '/login.html';
      return null;
    }
    return res;
  } catch (err) {
    console.error('Network error:', err);
    throw err;
  }
}
