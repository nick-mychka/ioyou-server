import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../db/index.js';
import { people } from '../db/schema.js';
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

// GET /people - List all people
peopleRoute.get('/', async (c) => {
  try {
    const allPeople = await db.query.people.findMany({
      orderBy: (people, { desc }) => [desc(people.createdAt)],
    });
    return c.json({ people: allPeople });
  } catch (error) {
    console.error('List people error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// GET /people/:id - Get a single person
peopleRoute.get('/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const person = await db.query.people.findFirst({
      where: eq(people.id, id),
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

  try {
    const [person] = await db.insert(people).values(data).returning();
    return c.json({ person }, 201);
  } catch (error) {
    console.error('Create person error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// PUT /people/:id - Update a person
peopleRoute.put('/:id', zValidator('json', updatePersonSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  try {
    const [person] = await db
      .update(people)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(people.id, id))
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

// DELETE /people/:id - Delete a person
peopleRoute.delete('/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const [person] = await db.delete(people).where(eq(people.id, id)).returning();

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

export default peopleRoute;
