import { sql } from 'drizzle-orm';
import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  username: text('username').notNull(),
  avatar: text('avatar'),
  email: text('email'),
  bio: text('bio'),
  tokenVersion: integer('tokenVersion').default(1),
  googleId: text('google_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export type User = typeof users.$inferSelect;
