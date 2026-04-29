export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startPerkWorker } = await import('./lib/rcon.js');
    startPerkWorker();
  }
}
