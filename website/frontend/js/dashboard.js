async function loadDashboard() {
  if (!getToken()) { window.location.href = '/login.html'; return; }

  const container = document.getElementById('dashboard-content');
  try {
    const res = await apiFetch('/dashboard');
    if (!res) return;
    const { user, purchases } = await res.json();

    container.innerHTML = `
      <div class="page-header">
        <h1>Welcome, ${user.minecraft_username}</h1>
        <p>Your NetzTech account &amp; perks</p>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">Active Perks</div>
          <div class="stat-value">${purchases.filter(p => p.perks_applied).length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Purchases</div>
          <div class="stat-value">${purchases.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Account</div>
          <div class="stat-value sm">${user.email}</div>
        </div>
      </div>

      <div class="table-card">
        <div class="table-card-header">
          <span>Your Purchases</span>
          <a href="/store.html" class="btn btn-primary btn-sm">Browse Store</a>
        </div>
        ${purchases.length === 0 ? `
          <div class="empty-state">
            <p>No purchases yet.</p>
            <a href="/store.html" class="btn btn-primary">Visit the Store</a>
          </div>
        ` : `
          <div style="overflow-x:auto">
            <table>
              <thead>
                <tr>
                  <th>Package</th>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Expires</th>
                  <th>Purchased</th>
                </tr>
              </thead>
              <tbody>
                ${purchases.map(p => `
                  <tr>
                    <td style="color:${p.color};font-weight:700">${p.product_name}</td>
                    <td>
                      <span class="badge ${p.perks_applied ? 'badge-active' : 'badge-pending'}">
                        ${p.perks_applied ? '<i class="fa-solid fa-check"></i> Active' : '<i class="fa-solid fa-clock"></i> Pending'}
                      </span>
                    </td>
                    <td>${p.billing_type === 'monthly' ? '<i class="fa-solid fa-rotate"></i> Monthly' : p.billing_type === 'yearly' ? '<i class="fa-solid fa-rotate"></i> Yearly' : '<i class="fa-solid fa-credit-card"></i> One-time'}</td>
                    <td>${p.expires_at ? new Date(p.expires_at).toLocaleDateString() : '—'}</td>
                    <td>${new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  } catch {
    container.innerHTML = '<p class="text-muted text-center mt-4">Failed to load dashboard.</p>';
  }
}

loadDashboard();
