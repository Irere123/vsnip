import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { conversationEntity } from '../conversation';
import { userEntity } from '../user';

export const messageEntity = pgTable('messages', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  conversationId: uuid('conversation_id').references(
    () => conversationEntity.id,
  ),
  senderId: uuid('sender_id').references(() => userEntity.id, {
    onDelete: 'cascade',
  }),
  recipientId: uuid('recipient_id').references(() => userEntity.id, {
    onDelete: 'cascade',
  }),
  text: text('text'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
