'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, getToken } from '@/lib/client-auth';
import { IconCheck, IconRefresh, IconCreditCard, IconZap } from '@/components/Icons';

function PackageCard({ product, onBuy, buying }) {
  const isSubscription = product.billing_type === 'monthly' || product.billing_type === 'yearly';

  return (
    <div
      className="card-lift flex flex-col rounded-xl overflow-hidden transition-all duration-300 group"
      style={{
        background: '#0d0d1a',
        border: `1px solid ${product.color}20`,
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 30px ${product.color}18, 0 20px 40px rgba(0,0,0,0.3)`; e.currentTarget.style.borderColor = `${product.color}50`; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = `${product.color}20`; }}
    >
      {/* Rank colour bar */}
      <div className="h-1 w-full transition-all duration-300 group-hover:h-1.5" style={{ background: `linear-gradient(90deg, ${product.color}, ${product.color}88)` }} />

      <div className="p-6 flex flex-col flex-1">
        {/* Name + billing badge */}
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-xl font-black" style={{ color: product.color }}>{product.name}</h3>
          {isSubscription && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-white/40 border border-white/10 rounded-full px-2 py-0.5 ml-2 mt-0.5">
              <IconRefresh size={10} /> recurring
            </span>
          )}
        </div>
        <p className="text-white/40 text-sm mb-5">{product.description}</p>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-end gap-1">
            <span className="text-4xl font-black text-white">${(product.price_cents / 100).toFixed(0)}</span>
            <span className="text-white/30 text-sm mb-1.5">
              {isSubscription ? `/${product.billing_type === 'yearly' ? 'yr' : 'mo'}` : ' one-time'}
            </span>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-2.5 mb-8 flex-1">
          {product.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-white/60">
              <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: `${product.color}18`, color: product.color }}>
                <IconCheck size={10} />
              </span>
              {f}
            </li>
          ))}
        </ul>

        {/* Buy button */}
        <button
          onClick={() => onBuy(product.id)}
          disabled={buying === product.id}
          className="btn w-full font-bold transition-all duration-200 disabled:opacity-50"
          style={{
            background: product.color,
            color: '#000',
          }}
          onMouseEnter={e => { if (buying !== product.id) e.currentTarget.style.boxShadow = `0 0 25px ${product.color}55`; }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; }}
        >
          {buying === product.id
            ? 'Redirecting…'
            : isSubscription
              ? `Subscribe — $${(product.price_cents / 100).toFixed(0)}/mo`
              : `Buy Now — $${(product.price_cents / 100).toFixed(0)}`}
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
      <div className="text-center mb-12 animate-fade-in-up">
        <h1 className="text-4xl font-black text-white mb-3">Server Store</h1>
        <p className="text-white/40 max-w-md mx-auto text-sm leading-relaxed">
          Support NetzTech and unlock exclusive in-game perks. All purchases are applied within 60 seconds.
        </p>
      </div>

      {error && <p className="alert-error mb-6 max-w-md mx-auto text-center">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-fade-in">
          {products.map(p => (
            <PackageCard key={p.id} product={p} onBuy={handleBuy} buying={buying} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-2 mt-10 text-white/20 text-xs">
        <IconCheck size={12} />
        Payments processed securely by Stripe
        <span className="mx-1">·</span>
        <IconZap size={12} />
        Perks applied within 60 seconds
      </div>
    </main>
  );
}
