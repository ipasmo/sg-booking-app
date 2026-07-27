import { seedDatabase, isDatabaseConfigured } from '../lib/database';

async function main() {
  if (!isDatabaseConfigured()) {
    console.log('[db:seed] DATABASE_URL is not configured. Skipping seed.');
    return;
  }

  await seedDatabase();
  console.log('[db:seed] Seed data has been applied.');
}

main().catch((error) => {
  console.error('[db:seed] Seed failed:', error);
  process.exitCode = 1;
});
