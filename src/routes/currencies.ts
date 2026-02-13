import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { db } from '../db/index.js';
import { currencies } from '../db/schema.js';
import { authMiddleware, type Env } from '../middleware/auth.js';

const currenciesRoute = new Hono<Env>();

// Require authentication for all routes
currenciesRoute.use('*', authMiddleware);

// Validation schemas
const createCurrencySchema = z.object({
  code: z.string().min(1).max(10),
});

// GET /currencies - List all currencies
currenciesRoute.get('/', async (c) => {
  try {
    const allCurrencies = await db.query.currencies.findMany({
      orderBy: (currencies, { asc }) => [asc(currencies.code)],
    });
    return c.json({ currencies: allCurrencies });
  } catch (error) {
    console.error('List currencies error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /currencies - Create a new currency
currenciesRoute.post('/', zValidator('json', createCurrencySchema), async (c) => {
  const data = c.req.valid('json');

  try {
    const [currency] = await db
      .insert(currencies)
      .values({ code: data.code.toUpperCase() })
      .returning();
    return c.json({ currency }, 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('duplicate key value')) {
      return c.json({ error: 'Currency already exists' }, 409);
    }
    console.error('Create currency error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default currenciesRoute;
