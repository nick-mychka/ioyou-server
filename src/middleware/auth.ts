import type { Context, Next } from 'hono';
import { verifyToken } from '../utils/auth.js';

export type Env = {
  Variables: {
    userId: string;
  };
};

export async function authMiddleware(c: Context<Env>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyToken(token);
    c.set('userId', payload.userId);
    await next();
  } catch (error: unknown) {
    return c.json({ error: 'Invalid or expired token' }, 401);
  }
}
