import type { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import * as conversationService from '../services/conversation.service';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const getConversations = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.userId) {
    return next(createHttpError(401, 'Not authenticated'));
  }
  try {
    const conversations = await conversationService.getConversationsForUser(
      req.userId,
    );
    return res.json({ conversations });
  } catch (error) {
    console.error('Controller error fetching conversations:', error);
    return next(error);
  }
};

export const createConversation = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.userId) {
    return next(createHttpError(401, 'Not authenticated'));
  }
  const { userId: otherUserId } = req.body;

  if (!otherUserId || typeof otherUserId !== 'string') {
    return next(createHttpError(400, 'Valid otherUserId is required'));
  }

  try {
    const result = await conversationService.findOrCreateConversation(
      req.userId,
      otherUserId,
    );
    return res
      .status(result.created ? 201 : 200)
      .json({ conv: result.conv, ok: true, created: result.created });
  } catch (error) {
    console.error('Controller error creating conversation:', error);
    return next(error);
  }
};
