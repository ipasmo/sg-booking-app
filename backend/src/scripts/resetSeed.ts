import { isDatabaseConfigured, resetDatabaseAndSeed } from '../lib/database';

async function main() {
  if (!isDatabaseConfigured()) {
    console.log('[db:reset:seed] DATABASE_URL is not configured. Skipping reset.');
    return;
  }

  await resetDatabaseAndSeed();
  console.log('[db:reset:seed] Database data has been deleted and reseeded.');
}

main().catch((error) => {
  console.error('[db:reset:seed] Reset failed:', error);
  process.exitCode = 1;
});