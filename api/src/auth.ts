import { verify } from 'jsonwebtoken';
import createHttpError from 'http-errors';
import type { NextFunction, RequestHandler, Response } from 'express';
import { eq } from 'drizzle-orm';
import passport from 'passport';
import {
  Strategy as GoogleStrategy,
  type Profile,
  type VerifyCallback,
} from 'passport-google-oauth20';

import { users } from './schema';
import { db } from './db';
import { config } from './config';
import { generateAuthTokens } from './services/auth.service';

export type RefreshTokenData = {
  userId: string;
  tokenVersion?: number;
};

export type AccessTokenData = {
  userId: string;
};

export const isAuth: (st?: boolean) => RequestHandler<{}, any, any> =
  (shouldThrow = true) =>
  async (req: any, res: Response, next: NextFunction): Promise<void> => {
    const accessToken = req.headers['access-token'];
    if (typeof accessToken !== 'string') {
      return next(shouldThrow && createHttpError(401, 'not authenticated'));
    }

    try {
      if (!config.accessTokenSecret)
        throw new Error('Access token secret not configured');
      const data = <AccessTokenData>(
        verify(accessToken, config.accessTokenSecret)
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
      if (!config.refreshTokenSecret)
        throw new Error('Refresh token secret not configured');
      data = <RefreshTokenData>verify(refreshToken, config.refreshTokenSecret);
    } catch {
      return next(shouldThrow && createHttpError(401, 'not authenticated'));
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, data.userId));

    if (!user || user.tokenVersion !== data.tokenVersion) {
      return next(shouldThrow && createHttpError(401, 'not authenticated'));
    }

    const tokens = generateAuthTokens(user);

    res.setHeader('refresh-token', tokens.refreshToken);
    res.setHeader('access-token', tokens.accessToken);
    req.userId = data.userId;

    next();
  };

export async function googleStrategyVerifyCallback(
  _accessToken: string,
  _refreshToken: string,
  profile: Profile,
  cb: VerifyCallback,
) {
  try {
    if (!profile.id) {
      return cb(new Error('Google profile did not return an ID.'), undefined);
    }

    let [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.googleId, profile.id))
      .limit(1);

    const email = profile.emails?.[0]?.value ?? null;
    const avatar = profile.photos?.[0]?.value ?? null;
    const displayName = profile.displayName || email || 'Unnamed User';

    if (!email) {
      return cb(new Error('Email not provided by Google profile.'), undefined);
    }

    if (userRecord) {
      if (
        userRecord.username !== displayName ||
        userRecord.avatar !== avatar ||
        userRecord.email !== email
      ) {
        [userRecord] = await db
          .update(users)
          .set({
            avatar: avatar,
            email: email,
            username: displayName,
          })
          .where(eq(users.googleId, profile.id))
          .returning();
      }
    } else {
      [userRecord] = await db
        .insert(users)
        .values({
          username: displayName,
          avatar: avatar,
          googleId: profile.id,
          email: email,
        })
        .returning();
    }

    if (!userRecord) {
      return cb(
        new Error('Failed to create or update user record after Google auth.'),
        undefined,
      );
    }
    return cb(null, generateAuthTokens(userRecord));
  } catch (err: any) {
    console.error('Error in Google OAuth Strategy:', err);
    return cb(err, undefined);
  }
}

export const initializePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.googleOAuthClientId as string,
        clientSecret: config.googleOAuthClientSecret as string,
        callbackURL: `${config.serverUrl}/api/auth/google/callback`,
        scope: ['profile', 'email'],
        passReqToCallback: false,
      },
      googleStrategyVerifyCallback,
    ),
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.accessToken);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      done(null, { id });
    } catch (err) {
      done(err, null);
    }
  });
};
