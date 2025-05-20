import { sql } from 'drizzle-orm';
import { boolean, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from '../user';

export const conversationEntity = pgTable('conversations', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId1: uuid('userId1').references(() => users.id, {
    onDelete: 'cascade',
  }),
  userId2: uuid('userId2').references(() => users.id, {
    onDelete: 'cascade',
  }),
  read1: boolean('read1').default(false),
  read2: boolean('read2').default(false),
  unfriended: boolean('unfriended').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
