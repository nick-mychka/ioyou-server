import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

import { db } from '../db/index.js';
import { recordStatuses } from '../db/schema.js';
import { authMiddleware, type Env } from '../middleware/auth.js';

const recordStatusesRoute = new Hono<Env>();

// Require authentication for all routes
recordStatusesRoute.use('*', authMiddleware);

// Validation schemas
const createRecordStatusSchema = z.object({
  code: z.string().min(1).max(50),
});

// GET /record-statuses - List all record statuses
recordStatusesRoute.get('/', async (c) => {
  try {
    const allStatuses = await db.query.recordStatuses.findMany({
      orderBy: (recordStatuses, { asc }) => [asc(recordStatuses.code)],
    });
    return c.json({ statuses: allStatuses });
  } catch (error) {
    console.error('List record statuses error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /record-statuses - Create a new record status
recordStatusesRoute.post('/', zValidator('json', createRecordStatusSchema), async (c) => {
  const data = c.req.valid('json');

  try {
    const [status] = await db
      .insert(recordStatuses)
      .values({ code: data.code.toLowerCase() })
      .returning();
    return c.json({ status }, 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('duplicate key value')) {
      return c.json({ error: 'Status already exists' }, 409);
    }
    console.error('Create record status error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default recordStatusesRoute;
