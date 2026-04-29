async function loadStore() {
  const grid = document.getElementById('store-grid');
  try {
    const res = await fetch('/api/products');
    const products = await res.json();

    if (!products.length) {
      grid.innerHTML = '<p class="text-muted text-center" style="grid-column:1/-1;padding:4rem">No packages available yet — check back soon!</p>';
      return;
    }

    grid.innerHTML = products.map(p => {
      const dollars = Math.floor(p.price_cents / 100);
      const cents = String(p.price_cents % 100).padStart(2, '0');
      const period = p.billing_type === 'monthly' ? '/mo' : p.billing_type === 'yearly' ? '/yr' : '';
      const badge = p.billing_type === 'monthly' ? 'Monthly' : p.billing_type === 'yearly' ? 'Yearly' : 'One-time';

      return `
        <div class="product-card" style="--card-accent:${p.color}">
          <span class="product-badge">${badge}</span>
          <div class="product-name">${p.name}</div>
          <p class="product-desc">${p.description || ''}</p>
          <div class="product-price">
            <sup>$</sup>${dollars}<sup style="font-size:1rem">.${cents}</sup>
            ${period ? `<span class="period">${period}</span>` : ''}
          </div>
          <ul class="product-features">
            ${p.features.map(f => `<li>${f}</li>`).join('')}
          </ul>
          <button class="btn btn-primary form-full w-full"
                  onclick="buyProduct(${p.id}, '${p.name.replace(/'/g, "\\'")}', this)">
            Get ${p.name}
          </button>
        </div>
      `;
    }).join('');
  } catch {
    grid.innerHTML = '<p class="text-muted text-center" style="grid-column:1/-1;padding:4rem">Failed to load packages. Please refresh.</p>';
  }
}

async function buyProduct(productId, name, btn) {
  if (!getToken()) {
    window.location.href = '/login.html';
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Redirecting...';

  try {
    const res = await apiFetch('/checkout/create-session', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId }),
    });
    if (!res) return;
    const data = await res.json();
    if (res.ok && data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error || 'Could not start checkout. Please try again.');
      btn.disabled = false;
      btn.textContent = `Get ${name}`;
    }
  } catch {
    alert('Something went wrong. Please try again.');
    btn.disabled = false;
    btn.textContent = `Get ${name}`;
  }
}

loadStore();
