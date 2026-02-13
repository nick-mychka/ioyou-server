import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../db/index.js';
import { people, records } from '../db/schema.js';
import { authMiddleware, type Env } from '../middleware/auth.js';

const peopleRoute = new Hono<Env>();

// Require authentication for all routes
peopleRoute.use('*', authMiddleware);

// Validation schemas
const createPersonSchema = z.object({
  name: z.string().min(1),
  email: z.email().optional(),
  description: z.string().nullable(),
});

const updatePersonSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.email().optional(),
  description: z.string().nullable().optional(),
});

const createRecordSchema = z.object({
  amount: z.string().refine((val) => !isNaN(parseFloat(val)), {
    message: 'Amount must be a valid number',
  }),
  currencyId: z.uuid(),
  note: z.string().nullable().optional(),
  loanDate: z.iso.date(),
  dueDate: z.iso.date().nullable().optional(),
  kind: z.enum(['loan', 'debt']),
  statusId: z.uuid(),
  interestRate: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: 'Interest rate must be a valid number',
    })
    .nullable()
    .optional(),
  penalty: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: 'Penalty must be a valid number',
    })
    .nullable()
    .optional(),
});

const updateRecordSchema = z.object({
  amount: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: 'Amount must be a valid number',
    })
    .optional(),
  currencyId: z.uuid().optional(),
  note: z.string().nullable().optional(),
  loanDate: z.iso.date().optional(),
  dueDate: z.iso.date().nullable().optional(),
  kind: z.enum(['loan', 'debt']).optional(),
  statusId: z.uuid().optional(),
  interestRate: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: 'Interest rate must be a valid number',
    })
    .nullable()
    .optional(),
  penalty: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), {
      message: 'Penalty must be a valid number',
    })
    .nullable()
    .optional(),
});

// GET /people - List all people created by the current user
peopleRoute.get('/', async (c) => {
  const userId = c.get('userId');

  try {
    const allPeople = await db.query.people.findMany({
      where: eq(people.createdBy, userId),
      orderBy: (people, { desc }) => [desc(people.createdAt)],
    });
    return c.json({ people: allPeople });
  } catch (error) {
    console.error('List people error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /people/:id - Get a single person owned by the current user
peopleRoute.get('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  try {
    const person = await db.query.people.findFirst({
      where: and(eq(people.id, id), eq(people.createdBy, userId)),
    });

    if (!person) {
      return c.json({ error: 'Person not found' }, 404);
    }

    return c.json({ person });
  } catch (error) {
    console.error('Get person error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /people - Create a new person
peopleRoute.post('/', zValidator('json', createPersonSchema), async (c) => {
  const data = c.req.valid('json');
  const userId = c.get('userId');

  try {
    const [person] = await db
      .insert(people)
      .values({ ...data, createdBy: userId })
      .returning();
    return c.json({ person }, 201);
  } catch (error) {
    console.error('Create person error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PUT /people/:id - Update a person owned by the current user
peopleRoute.put('/:id', zValidator('json', updatePersonSchema), async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');
  const data = c.req.valid('json');

  try {
    const [person] = await db
      .update(people)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(people.id, id), eq(people.createdBy, userId)))
      .returning();

    // eslint-disable-next-line
    if (!person) {
      return c.json({ error: 'Person not found' }, 404);
    }

    return c.json({ person });
  } catch (error) {
    console.error('Update person error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// DELETE /people/:id - Delete a person owned by the current user
peopleRoute.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const userId = c.get('userId');

  try {
    const [person] = await db
      .delete(people)
      .where(and(eq(people.id, id), eq(people.createdBy, userId)))
      .returning();

    // eslint-disable-next-line
    if (!person) {
      return c.json({ error: 'Person not found' }, 404);
    }

    return c.json({ message: 'Person deleted' });
  } catch (error) {
    console.error('Delete person error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Helper to verify person ownership
async function verifyPersonOwnership(personId: string, userId: string) {
  const person = await db.query.people.findFirst({
    where: and(eq(people.id, personId), eq(people.createdBy, userId)),
  });
  return person;
}

// GET /people/:personId/records - List all records for a person
peopleRoute.get('/:personId/records', async (c) => {
  const personId = c.req.param('personId');
  const userId = c.get('userId');

  try {
    const person = await verifyPersonOwnership(personId, userId);
    if (!person) {
      return c.json({ error: 'Person not found' }, 404);
    }

    const allRecords = await db.query.records.findMany({
      where: eq(records.personId, personId),
      orderBy: (records, { desc }) => [desc(records.loanDate)],
    });
    return c.json({ records: allRecords });
  } catch (error) {
    console.error('List records error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /people/:personId/records/:recordId - Get a single record
peopleRoute.get('/:personId/records/:recordId', async (c) => {
  const personId = c.req.param('personId');
  const recordId = c.req.param('recordId');
  const userId = c.get('userId');

  try {
    const person = await verifyPersonOwnership(personId, userId);
    if (!person) {
      return c.json({ error: 'Person not found' }, 404);
    }

    const record = await db.query.records.findFirst({
      where: and(eq(records.id, recordId), eq(records.personId, personId)),
    });

    if (!record) {
      return c.json({ error: 'Record not found' }, 404);
    }

    return c.json({ record });
  } catch (error) {
    console.error('Get record error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// POST /people/:personId/records - Create a new record
peopleRoute.post('/:personId/records', zValidator('json', createRecordSchema), async (c) => {
  const personId = c.req.param('personId');
  const userId = c.get('userId');
  const data = c.req.valid('json');

  try {
    const person = await verifyPersonOwnership(personId, userId);
    if (!person) {
      return c.json({ error: 'Person not found' }, 404);
    }

    const [record] = await db
      .insert(records)
      .values({
        personId,
        amount: data.amount,
        currencyId: data.currencyId,
        note: data.note ?? null,
        loanDate: data.loanDate,
        dueDate: data.dueDate ?? null,
        kind: data.kind,
        statusId: data.statusId,
        interestRate: data.interestRate ?? null,
        penalty: data.penalty ?? null,
      })
      .returning();
    return c.json({ record }, 201);
  } catch (error) {
    console.error('Create record error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PUT /people/:personId/records/:recordId - Update a record
peopleRoute.put(
  '/:personId/records/:recordId',
  zValidator('json', updateRecordSchema),
  async (c) => {
    const personId = c.req.param('personId');
    const recordId = c.req.param('recordId');
    const userId = c.get('userId');
    const data = c.req.valid('json');

    try {
      const person = await verifyPersonOwnership(personId, userId);
      if (!person) {
        return c.json({ error: 'Person not found' }, 404);
      }

      const [record] = await db
        .update(records)
        .set(data)
        .where(and(eq(records.id, recordId), eq(records.personId, personId)))
        .returning();

      // eslint-disable-next-line
      if (!record) {
        return c.json({ error: 'Record not found' }, 404);
      }

      return c.json({ record });
    } catch (error) {
      console.error('Update record error:', error);
      return c.json({ error: 'Internal server error' }, 500);
    }
  }
);

// DELETE /people/:personId/records/:recordId - Delete a record
peopleRoute.delete('/:personId/records/:recordId', async (c) => {
  const personId = c.req.param('personId');
  const recordId = c.req.param('recordId');
  const userId = c.get('userId');

  try {
    const person = await verifyPersonOwnership(personId, userId);
    if (!person) {
      return c.json({ error: 'Person not found' }, 404);
    }

    const [record] = await db
      .delete(records)
      .where(and(eq(records.id, recordId), eq(records.personId, personId)))
      .returning();

    // eslint-disable-next-line
    if (!record) {
      return c.json({ error: 'Record not found' }, 404);
    }

    return c.json({ message: 'Record deleted' });
  } catch (error) {
    console.error('Delete record error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default peopleRoute;
