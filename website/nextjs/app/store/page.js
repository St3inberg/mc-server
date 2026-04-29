'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getToken } from '@/lib/client-auth';

function PackageCard({ product, onBuy, buying }) {
  const isSubscription = product.billing_type === 'monthly' || product.billing_type === 'yearly';
  return (
    <div
      className="card flex flex-col transition-all duration-300 hover:-translate-y-1 overflow-hidden"
      style={{ borderColor: `${product.color}22` }}
    >
      <div className="h-1 w-full" style={{ background: product.color }} />
      <div className="p-6 flex flex-col flex-1">
        <div className="mb-4">
          <h3 className="text-xl font-black mb-1" style={{ color: product.color }}>
            {product.name}
          </h3>
          <p className="text-white/40 text-sm">{product.description}</p>
        </div>

        <div className="mb-6">
          <div className="flex items-end gap-1">
            <span className="text-4xl font-black text-white">
              ${(product.price_cents / 100).toFixed(0)}
            </span>
            <span className="text-white/30 text-sm mb-1">
              {isSubscription ? `/${product.billing_type === 'yearly' ? 'yr' : 'mo'}` : ' one-time'}
            </span>
          </div>
        </div>

        <ul className="space-y-2 mb-8 flex-1">
          {product.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/60">
              <span className="text-accent mt-0.5 shrink-0">✓</span>
              {f}
            </li>
          ))}
        </ul>

        <button
          onClick={() => onBuy(product.id)}
          disabled={buying === product.id}
          className="btn btn-primary w-full"
          style={buying !== product.id ? { '--tw-shadow-color': product.color } : {}}
        >
          {buying === product.id ? 'Redirecting…' : isSubscription ? `Subscribe — $${(product.price_cents / 100).toFixed(0)}/mo` : `Buy Now — $${(product.price_cents / 100).toFixed(0)}`}
        </button>
      </div>
    </div>
  );
}

export default function StorePage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(data => { setProducts(data); setLoading(false); });
  }, []);

  async function handleBuy(productId) {
    if (!getToken()) { router.push('/login'); return; }
    setBuying(productId);
    setError(null);
    const res = await apiFetch('/checkout', { method: 'POST', body: JSON.stringify({ product_id: productId }) });
    if (!res) { setBuying(null); return; }
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setError(data.error || 'Checkout failed');
      setBuying(null);
    }
  }

  return (
    <main className="page">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-white mb-3">Server Store</h1>
        <p className="text-white/40 max-w-md mx-auto text-sm">
          Support NetzTech and unlock exclusive in-game perks. All purchases are instant.
        </p>
      </div>

      {error && <p className="alert-error mb-6 max-w-md mx-auto text-center">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map(p => <PackageCard key={p.id} product={p} onBuy={handleBuy} buying={buying} />)}
        </div>
      )}

      <p className="text-center text-white/20 text-xs mt-10">
        All purchases are processed securely through Stripe. Perks are applied within 60 seconds of payment.
      </p>
    </main>
  );
}
