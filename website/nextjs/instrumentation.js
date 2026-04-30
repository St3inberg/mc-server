export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('./lib/validate-env.js');
    validateEnv();
    const { startPerkWorker } = await import('./lib/rcon.js');
    startPerkWorker();
  }
}
