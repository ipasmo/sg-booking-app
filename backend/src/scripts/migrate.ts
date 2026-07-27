import { ensureDatabaseReady, isDatabaseConfigured } from '../lib/database';

async function main() {
  if (!isDatabaseConfigured()) {
    console.log('[db:migrate] DATABASE_URL is not configured. Skipping migration.');
    return;
  }

  await ensureDatabaseReady();
  console.log('[db:migrate] Database schema is ready.');
}

main().catch((error) => {
  console.error('[db:migrate] Migration failed:', error);
  process.exitCode = 1;
});
