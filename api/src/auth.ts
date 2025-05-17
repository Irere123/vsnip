import { sign, verify } from 'jsonwebtoken';
import createHttpError from 'http-errors';
import type { NextFunction, RequestHandler, Response } from 'express';
import { eq } from 'drizzle-orm';

import { type User, userEntity } from './schema';
import { db } from './db';

export type RefreshTokenData = {
  userId: string;
  tokenVersion?: number;
};

export type AccessTokenData = {
  userId: string;
};

export const createTokens = (
  user: User,
): { refreshToken: string; accessToken: string } => {
  const refreshToken = sign(
    { userId: user.id, tokenVersion: user.tokenVersion },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: '14d',
    },
  );
  const accessToken = sign(
    { userId: user.id },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: '15min',
    },
  );

  return { refreshToken, accessToken };
};

export const isAuth: (st?: boolean) => RequestHandler<{}, any, any> =
  (shouldThrow = true) =>
  async (req: any, res: Response, next: NextFunction): Promise<void> => {
    const accessToken = req.headers['access-token'];
    if (typeof accessToken !== 'string') {
      return next(shouldThrow && createHttpError(401, 'not authenticated'));
    }

    try {
      const data = <AccessTokenData>(
        verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
      );
      req.userId = data.userId;
      return next();
    } catch {}

    const refreshToken = req.headers['refresh-token'];
    if (typeof refreshToken !== 'string') {
      return next(shouldThrow && createHttpError(401, 'not authenticated'));
    }

    let data: RefreshTokenData;
    try {
      data = <RefreshTokenData>(
        verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
      );
    } catch {
      return next(shouldThrow && createHttpError(401, 'not authenticated'));
    }

    const user = await db
      .select()
      .from(userEntity)
      .where(eq(userEntity.id, data.userId));
    // token has been invalidated or user deleted
    if (!user || user[0].tokenVersion !== data.tokenVersion) {
      return next(shouldThrow && createHttpError(401, 'not authenticated'));
    }

    const tokens = createTokens(user[0]);

    res.setHeader('refresh-token', tokens.refreshToken);
    res.setHeader('access-token', tokens.accessToken);
    req.userId = data.userId;

    next();
  };
