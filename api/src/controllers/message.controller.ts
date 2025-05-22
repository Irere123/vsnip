import type { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import * as messageService from '../services/message.service';

interface AuthenticatedRequest extends Request {
  userId?: string;
  params: Request['params'] & { userId?: string; cursor?: string };
}

export const getMessages = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.userId) {
    return next(createHttpError(401, 'Not authenticated'));
  }
  const loggedInUserId = req.userId;
  const { userId: otherUserId, cursor } = req.params;

  if (!otherUserId) {
    return next(
      createHttpError(400, 'Other user ID (userId) parameter is required'),
    );
  }

  try {
    const result = await messageService.getMessagesForUser(
      loggedInUserId,
      otherUserId,
      cursor,
    );
    return res.json(result);
  } catch (error) {
    console.error('Controller error fetching messages:', error);
    return next(error);
  }
};

export const createMessage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.userId) {
    return next(createHttpError(401, 'Not authenticated'));
  }
  const senderId = req.userId;
  const { recipientId, text } = req.body;

  if (!recipientId || !text) {
    return next(createHttpError(400, 'recipientId, and text are required'));
  }
  if (typeof text !== 'string' || text.trim().length === 0) {
    return next(createHttpError(400, 'Message text cannot be empty'));
  }

  if (recipientId === senderId) {
    return next(
      createHttpError(400, 'Recipient cannot be the same as the sender'),
    );
  }

  try {
    const newMessage = await messageService.createNewMessage(senderId, {
      recipientId,
      text,
    });
    return res.status(201).json({ message: newMessage });
  } catch (error) {
    console.error('Controller error creating message:', error);
    return next(error);
  }
};
