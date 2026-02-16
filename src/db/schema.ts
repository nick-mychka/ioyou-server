import { pgTable, pgEnum, text, timestamp, uuid, decimal } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const people = pgTable('people', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email'),
  description: text('description'),
  createdBy: uuid('created_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;

// Enum for record kind
export const recordKindEnum = pgEnum('record_kind', ['loan', 'debt']);

// Currencies table
export const currencies = pgTable('currencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
});

export type Currency = typeof currencies.$inferSelect;
export type NewCurrency = typeof currencies.$inferInsert;

// Record statuses table
export const recordStatuses = pgTable('record_statuses', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
});

export type RecordStatus = typeof recordStatuses.$inferSelect;
export type NewRecordStatus = typeof recordStatuses.$inferInsert;

// Records table
export const records = pgTable('records', {
  id: uuid('id').primaryKey().defaultRandom(),
  personId: uuid('person_id')
    .notNull()
    .references(() => people.id, { onDelete: 'cascade' }),
  amount: decimal('amount').notNull(),
  currencyId: uuid('currency_id')
    .notNull()
    .references(() => currencies.id, { onDelete: 'no action' }),
  note: text('note'),
  loanDate: timestamp('loan_date').notNull(),
  dueDate: timestamp('due_date'),
  kind: recordKindEnum('kind').notNull(),
  statusId: uuid('status_id')
    .notNull()
    .references(() => recordStatuses.id, { onDelete: 'no action' }),
  interestRate: decimal('interest_rate'),
  penalty: decimal('penalty'),
});

export type Record = typeof records.$inferSelect;
export type NewRecord = typeof records.$inferInsert;
