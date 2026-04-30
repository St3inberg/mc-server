// Called at startup — crashes loudly if critical env vars are missing
const REQUIRED = [
  'JWT_SECRET',
  'STRIPE_SECRET_KEY',
  'RCON_PASSWORD',
];

export function validateEnv() {
  const missing = REQUIRED.filter(k => !process.env[k]);
  if (missing.length) {
    console.error(`[startup] Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  if (process.env.JWT_SECRET.length < 32) {
    console.error('[startup] JWT_SECRET must be at least 32 characters');
    process.exit(1);
  }
  if (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') && process.env.NODE_ENV === 'production') {
    console.warn('[startup] WARNING: using Stripe test key in production');
  }
  if (!process.env.RESEND_API_KEY) {
    console.warn('[startup] WARNING: RESEND_API_KEY not set — password reset emails will not be sent');
  }
}
