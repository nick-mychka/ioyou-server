import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrationClient } from './index.js';

async function main() {
  console.log('Running migrations...');

  const db = drizzle(migrationClient);
  await migrate(db, { migrationsFolder: './drizzle' });

  console.log('Migrations complete!');
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error('Migration failed!');
  console.error(err);
  process.exit(1);
});
