import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import * as dotenv from 'dotenv';

import auth from './routes/auth.js';
import people from './routes/people.js';
import currencies from './routes/currencies.js';
import recordStatuses from './routes/record-statuses.js';

dotenv.config();

const app = new Hono();

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173', // Your Vite dev server
    credentials: true,
  })
);

// Routes
app.route('/auth', auth);
app.route('/people', people);
app.route('/currencies', currencies);
app.route('/record-statuses', recordStatuses);

app.get('/', (c) => {
  return c.text('Welcome to IOYou!');
});
// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

const server = serve(
  {
    fetch: app.fetch,
    port: process.env.PORT ? Number(process.env.PORT) : 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);

// graceful shutdown
process.on('SIGINT', () => {
  server.close();
  process.exit(0);
});
process.on('SIGTERM', () => {
  server.close((err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    process.exit(0);
  });
});
