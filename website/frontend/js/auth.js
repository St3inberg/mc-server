function getToken() { return localStorage.getItem('netztech_token'); }
function getUsername() { return localStorage.getItem('netztech_username'); }
function isAdmin() { return localStorage.getItem('netztech_admin') === '1'; }

function saveAuth(data) {
  localStorage.setItem('netztech_token', data.token);
  localStorage.setItem('netztech_username', data.username);
  localStorage.setItem('netztech_admin', data.is_admin ? '1' : '0');
}

function logout() {
  localStorage.removeItem('netztech_token');
  localStorage.removeItem('netztech_username');
  localStorage.removeItem('netztech_admin');
  window.location.href = '/';
}

function updateNav() {
  const navActions = document.getElementById('nav-actions');
  if (!navActions) return;

  const token = getToken();
  const username = getUsername();
  const navLinks = document.querySelector('.nav-links');

  if (token && username) {
    navActions.innerHTML = `
      <span style="color:var(--text-muted);font-size:0.875rem;font-weight:500">👤 ${username}</span>
      <button class="btn btn-secondary btn-sm" onclick="logout()">Logout</button>
    `;
    if (navLinks) {
      const hrefs = [...navLinks.querySelectorAll('a')].map(a => a.getAttribute('href'));
      if (!hrefs.includes('/dashboard.html')) {
        const li = document.createElement('li');
        li.innerHTML = `<a href="/dashboard.html">Dashboard</a>`;
        navLinks.appendChild(li);
      }
      if (isAdmin() && !hrefs.includes('/admin.html')) {
        const li = document.createElement('li');
        li.innerHTML = `<a href="/admin.html">Admin</a>`;
        navLinks.appendChild(li);
      }
    }
  } else {
    navActions.innerHTML = `
      <a href="/login.html" class="btn btn-secondary btn-sm">Login</a>
      <a href="/register.html" class="btn btn-primary btn-sm">Register</a>
    `;
  }
}

updateNav();
