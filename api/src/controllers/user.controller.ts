import type { Request, Response, NextFunction } from 'express';
import createHttpError from 'http-errors';
import { config } from '../config';
import * as userService from '../services/user.service';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const getFeed = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.userId) {
    return next(createHttpError(401, 'Not authenticated'));
  }
  try {
    const profiles = await userService.getFeedProfiles(req.userId);
    return res.json({ profiles });
  } catch (error) {
    console.error('Controller error fetching feed:', error);
    return next(error);
  }
};

export const updateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  if (!req.userId) {
    return next(createHttpError(401, 'Not authenticated'));
  }
  const { email, username } = req.body;

  if (
    typeof email !== 'string' ||
    typeof username !== 'string' ||
    !email.trim() ||
    !username.trim()
  ) {
    return next(
      createHttpError(
        400,
        'Email and username are required and must be non-empty strings.',
      ),
    );
  }

  try {
    const updatedUser = await userService.updateUserDetails(req.userId, {
      email,
      username,
    });
    if (!updatedUser) {
      return next(
        createHttpError(404, 'User not found or update failed in service'),
      );
    }
    return res.json({ user: updatedUser });
  } catch (error) {
    console.error('Controller error updating user:', error);
    return next(error);
  }
};

export const getUserById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const { id: userIdToFetch } = req.params;

  if (!userIdToFetch) {
    return next(createHttpError(400, 'User ID parameter is required'));
  }

  try {
    const userRecord = await userService.findUserById(userIdToFetch);
    if (!userRecord) {
      return next(createHttpError(404, 'User not found'));
    }
    const { tokenVersion, googleId, email, ...safeUser } = userRecord;
    return res.json({ user: { ...safeUser, email } });
  } catch (error) {
    console.error('Controller error fetching user by ID:', error);
    return next(error);
  }
};

export const devCreateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (config.prod) {
    return next(
      createHttpError(403, 'This route is not available in production'),
    );
  }
  const { email, bio, username, avatar } = req.body;

  if (!email || !username) {
    return next(
      createHttpError(
        400,
        'Email and username are required for dev user creation',
      ),
    );
  }

  try {
    const newUser = await userService.createDevelopmentUser({
      username: username as string,
      email: email as string,
      bio: bio as string | undefined,
      avatar: avatar as string | undefined,
    });
    return res.status(201).json({ user: newUser });
  } catch (error) {
    console.error('Controller error creating dev user:', error);
    return next(error);
  }
};
