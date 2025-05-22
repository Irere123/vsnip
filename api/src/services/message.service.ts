import { db } from '../db';
import { messageEntity } from '../schema';
import { and, eq, or, desc, lt } from 'drizzle-orm';
import createHttpError from 'http-errors';
import { wsSend } from '../websocket';

export type Message = typeof messageEntity.$inferSelect;

export const getMessagesForUser = async (
  loggedInUserId: string,
  otherUserId: string,
  cursor?: string,
  limit = 20,
): Promise<{ messages: Message[]; hasMore: boolean }> => {
  const actualLimit = limit + 1;
  let parsedCursorDate: Date | undefined;

  if (cursor) {
    const cursorTimestamp = Number.parseInt(cursor, 10);
    if (Number.isNaN(cursorTimestamp) || cursorTimestamp <= 0) {
      throw createHttpError(
        400,
        'Invalid cursor: must be a positive timestamp.',
      );
    }
    parsedCursorDate = new Date(cursorTimestamp);
  }

  try {
    const query = db
      .select()
      .from(messageEntity)
      .where(
        and(
          or(
            and(
              eq(messageEntity.recipientId, otherUserId),
              eq(messageEntity.senderId, loggedInUserId),
            ),
            and(
              eq(messageEntity.senderId, otherUserId),
              eq(messageEntity.recipientId, loggedInUserId),
            ),
          ),
          parsedCursorDate
            ? lt(messageEntity.createdAt, parsedCursorDate)
            : undefined,
        ),
      )
      .orderBy(desc(messageEntity.createdAt))
      .limit(actualLimit);

    const messages = await query;

    const hasMore = messages.length === actualLimit;
    const responseMessages = hasMore ? messages.slice(0, limit) : messages;

    return { messages: responseMessages, hasMore };
  } catch (error) {
    console.error('Service error fetching messages:', error);
    throw createHttpError(500, 'Database error while fetching messages.');
  }
};

export const createNewMessage = async (
  senderId: string,
  data: { recipientId: string; text: string },
): Promise<Message> => {
  const { recipientId, text } = data;

  if (!recipientId || !text || typeof text !== 'string' || !text.trim()) {
    throw createHttpError(
      400,
      'Missing or invalid parameters for message creation.',
    );
  }
  if (recipientId === senderId) {
    throw createHttpError(400, 'Recipient cannot be the same as the sender.');
  }

  try {
    const [newMessage] = await db
      .insert(messageEntity)
      .values({ recipientId, text: text.trim(), senderId })
      .returning();

    if (!newMessage) {
      throw createHttpError(500, 'Failed to create message in database.');
    }

    wsSend(recipientId, { type: 'new-message', message: newMessage });

    return newMessage;
  } catch (error) {
    console.error('Service error creating message:', error);
    throw createHttpError(500, 'Database error while creating message.');
  }
};
