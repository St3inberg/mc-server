import Link from 'next/link';

export default function SuccessPage() {
  return (
    <main className="page-sm text-center">
      <div className="card p-12">
        <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-accent mb-3">Payment Successful!</h1>
        <p className="text-white/50 text-sm leading-relaxed mb-8">
          Thank you for supporting NetzTech! Your perks will be applied to your Minecraft
          account within 60 seconds. If you're already online you'll see the change immediately.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/dashboard" className="btn btn-primary">View Dashboard</Link>
          <Link href="/store" className="btn btn-secondary">Browse More</Link>
        </div>
      </div>
    </main>
  );
}
