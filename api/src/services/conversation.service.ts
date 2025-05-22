import { db } from '../db';
import { conversationEntity } from '../schema';
import { and, eq, or, sql } from 'drizzle-orm';
import createHttpError from 'http-errors';
import { getUserIdOrder } from '../utils';

export type Conversation = typeof conversationEntity.$inferSelect;

export interface EnrichedConversation {
  read: boolean;
  conversationId: string;
  userId: string;
  username: string;
  avatar: string | null;
  createdAt: number;
  message: {
    text: string;
    createdAt: number;
  } | null;
}

export const getConversationsForUser = async (
  userId: string,
): Promise<EnrichedConversation[]> => {
  try {
    const conversationsResult = await db.execute(sql`
      SELECT
        CASE
          WHEN u.id = co."userId1" THEN co.read2
          ELSE co.read1
        END "read",
        co.id "conversationId",
        u.id "userId",
        u."username",
        u."avatar",
        date_part('epoch', co."created_at") * 1000 "createdAt",
        (SELECT json_build_object(
          'text',
          CASE
            WHEN char_length(text) > 40 THEN substr(text, 0, 40) || '...'
            ELSE text
          END,
          'createdAt', date_part('epoch', m."created_at") * 1000
        )
        FROM messages m
        WHERE (m.recipient_id = co."userId1" AND m."sender_id" = co."userId2")
           OR (m."sender_id" = co."userId1" AND m.recipient_id = co."userId2")
        ORDER BY m."created_at" DESC
        LIMIT 1) message
      FROM conversations co
      INNER JOIN "users" u ON u.id != ${userId} AND (u.id = co."userId1" OR u.id = co."userId2")
      WHERE (co."userId1" = ${userId} OR co."userId2" = ${userId}) AND co.unfriended = FALSE
      ORDER BY (SELECT m."created_at" FROM messages m
                WHERE (m.recipient_id = co."userId1" AND m."sender_id" = co."userId2")
                   OR (m."sender_id" = co."userId1" AND m.recipient_id = co."userId2")
                ORDER BY m."created_at" DESC
                LIMIT 1) DESC NULLS LAST
      LIMIT 150
    `);
    return conversationsResult.rows as unknown as EnrichedConversation[];
  } catch (error) {
    console.error('Service error fetching conversations:', error);
    throw createHttpError(500, 'Database error while fetching conversations.');
  }
};

export const findOrCreateConversation = async (
  currentUserAuthId: string,
  otherUserId: string,
): Promise<{ conv: Conversation; created: boolean }> => {
  if (otherUserId === currentUserAuthId) {
    throw createHttpError(400, 'Cannot create a conversation with yourself.');
  }

  try {
    const [existingConversation] = await db
      .select()
      .from(conversationEntity)
      .where(
        or(
          and(
            eq(conversationEntity.userId1, otherUserId),
            eq(conversationEntity.userId2, currentUserAuthId),
          ),
          and(
            eq(conversationEntity.userId1, currentUserAuthId),
            eq(conversationEntity.userId2, otherUserId),
          ),
        ),
      );

    if (existingConversation) {
      if (existingConversation.unfriended) {
        const [updatedConv] = await db
          .update(conversationEntity)
          .set({ unfriended: false })
          .where(eq(conversationEntity.id, existingConversation.id))
          .returning();
        if (!updatedConv) throw new Error('Failed to reactivate conversation');
        return { conv: updatedConv, created: true };
      }
      return { conv: existingConversation, created: false };
    }

    const userIds = getUserIdOrder(otherUserId, currentUserAuthId);
    const [newConversation] = await db
      .insert(conversationEntity)
      .values(userIds)
      .returning();
    if (!newConversation)
      throw new Error('Failed to create new conversation after insert.');

    return { conv: newConversation, created: true };
  } catch (error) {
    console.error('Service error creating/finding conversation:', error);
    throw createHttpError(
      500,
      'Database error while creating/finding conversation.',
    );
  }
};

export const markConversationAsRead = async (
  currentUserId: string,
  otherUserId: string,
): Promise<void> => {
  if (!currentUserId || !otherUserId) {
    console.warn(
      'markConversationAsRead: currentUserId or otherUserId is missing',
    );
    return;
  }

  const { userId1, userId2 } = getUserIdOrder(currentUserId, otherUserId);
  const readFlagToUpdate =
    currentUserId === userId1 ? { read1: true } : { read2: true };

  try {
    await db
      .update(conversationEntity)
      .set(readFlagToUpdate)
      .where(
        and(
          eq(conversationEntity.userId1, userId1),
          eq(conversationEntity.userId2, userId2),
        ),
      );
    console.log(
      `Conversation between ${currentUserId} and ${otherUserId} marked as read for ${currentUserId}.`,
    );
  } catch (error) {
    console.error(
      `Service error marking conversation as read for ${currentUserId} with ${otherUserId}:`,
      error,
    );
  }
};
