async function loadAdmin() {
  if (!getToken()) { window.location.href = '/login.html'; return; }

  const container = document.getElementById('admin-content');
  try {
    const res = await apiFetch('/admin/stats');
    if (!res) return;
    if (res.status === 403) {
      container.innerHTML = '<p class="text-muted text-center mt-4" style="padding:4rem">Access denied — admin only.</p>';
      return;
    }
    const { totalRevenue, totalUsers, totalPurchases, recentPurchases } = await res.json();

    container.innerHTML = `
      <div class="page-header flex justify-between items-center">
        <div>
          <h1>Admin Panel</h1>
          <p>NetzTech server management</p>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="flushQueue()">🔄 Flush Perk Queue</button>
      </div>

      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-label">Total Revenue</div>
          <div class="stat-value">$${(totalRevenue / 100).toFixed(2)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Users</div>
          <div class="stat-value">${totalUsers}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Completed Sales</div>
          <div class="stat-value">${totalPurchases}</div>
        </div>
      </div>

      <div class="table-card" style="margin-bottom:1.5rem">
        <div class="table-card-header">Recent Purchases</div>
        <div style="overflow-x:auto">
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th>Package</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${recentPurchases.length === 0
                ? `<tr><td colspan="5" class="text-muted text-center" style="padding:2rem">No purchases yet</td></tr>`
                : recentPurchases.map(p => `
                  <tr>
                    <td>
                      <strong>${p.minecraft_username}</strong>
                      <br><small style="color:var(--text-muted)">${p.email}</small>
                    </td>
                    <td>${p.product_name}</td>
                    <td>$${(p.amount_paid_cents / 100).toFixed(2)}</td>
                    <td><span class="badge badge-${p.status}">${p.status}</span></td>
                    <td>${new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex gap-2" style="flex-wrap:wrap">
        <button class="btn btn-secondary" onclick="loadUsersPanel()">👥 Manage Users</button>
        <button class="btn btn-secondary" onclick="loadProductsPanel()">📦 Manage Products</button>
      </div>

      <div id="sub-panel" style="margin-top:1.5rem"></div>
    `;
  } catch {
    container.innerHTML = '<p class="text-muted text-center mt-4">Failed to load admin panel.</p>';
  }
}

async function flushQueue() {
  const res = await apiFetch('/admin/queue/flush', { method: 'POST' });
  if (res?.ok) alert('Perk queue flushed — check server console for results.');
}

async function loadUsersPanel() {
  const panel = document.getElementById('sub-panel');
  panel.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  const res = await apiFetch('/admin/users');
  const users = await res.json();

  panel.innerHTML = `
    <div class="table-card">
      <div class="table-card-header">All Users (${users.length})</div>
      <div style="overflow-x:auto">
        <table>
          <thead><tr><th>Username</th><th>Email</th><th>Admin</th><th>Registered</th><th>Actions</th></tr></thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td><strong>${u.minecraft_username}</strong></td>
                <td>${u.email}</td>
                <td>${u.is_admin ? '✓ Admin' : '—'}</td>
                <td>${new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  ${!u.is_admin ? `<button class="btn btn-secondary btn-sm" onclick="makeAdmin(${u.id})">Make Admin</button>` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function makeAdmin(userId) {
  if (!confirm('Grant admin access to this user?')) return;
  const res = await apiFetch(`/admin/users/${userId}/make-admin`, { method: 'POST' });
  if (res?.ok) { alert('Done!'); loadUsersPanel(); }
}

async function loadProductsPanel() {
  const panel = document.getElementById('sub-panel');
  panel.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  const res = await apiFetch('/admin/products');
  const products = await res.json();

  panel.innerHTML = `
    <div class="table-card">
      <div class="table-card-header">
        <span>Products (${products.length})</span>
      </div>
      <div style="overflow-x:auto">
        <table>
          <thead><tr><th>Name</th><th>Price</th><th>Type</th><th>Rank</th><th>Active</th></tr></thead>
          <tbody>
            ${products.map(p => `
              <tr>
                <td style="color:${p.color};font-weight:700">${p.name}</td>
                <td>$${(p.price_cents / 100).toFixed(2)}</td>
                <td>${p.billing_type}</td>
                <td><code style="font-size:0.8rem;color:var(--text-muted)">${p.rank_name || '—'}</code></td>
                <td><span class="badge ${p.active ? 'badge-active' : 'badge-cancelled'}">${p.active ? 'Active' : 'Hidden'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    <p class="text-muted mt-2" style="font-size:0.8rem">Edit products directly in the database or via the API. Use <code>PUT /api/admin/products/:id</code>.</p>
  `;
}

loadAdmin();
