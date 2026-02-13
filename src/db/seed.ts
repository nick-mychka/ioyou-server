import * as dotenv from 'dotenv';

import { db } from './index.js';
import { currencies, recordStatuses } from './schema.js';

dotenv.config();

const seedCurrencies = [{ code: 'USD' }, { code: 'EUR' }, { code: 'USDT' }];

const seedStatuses = [{ code: 'active' }, { code: 'paid' }, { code: 'overdue' }];

async function seed() {
  console.log('Seeding currencies...');
  for (const currency of seedCurrencies) {
    await db.insert(currencies).values(currency).onConflictDoNothing({ target: currencies.code });
  }
  console.log('Currencies seeded.');

  console.log('Seeding record statuses...');
  for (const status of seedStatuses) {
    await db
      .insert(recordStatuses)
      .values(status)
      .onConflictDoNothing({ target: recordStatuses.code });
  }
  console.log('Record statuses seeded.');

  console.log('Seed completed!');
  process.exit(0);
}

seed().catch((err: unknown) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
