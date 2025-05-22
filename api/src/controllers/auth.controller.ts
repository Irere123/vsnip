import type { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { db } from '../db';
import { users } from '../schema';
import { eq } from 'drizzle-orm';
import { config } from '../config';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface GoogleCallbackRequest extends Request {
  query: Request['query'] & { state?: string };
}

interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const googleLogin = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const stateObject = { rn: false, rn2: false }; // Default state
  const state = Buffer.from(JSON.stringify(stateObject)).toString('base64');
  passport.authenticate('google', {
    session: false,
    state,
  })(req, res, next);
};

export const googleCallback = (
  req: GoogleCallbackRequest,
  res: Response,
  _next: NextFunction,
) => {
  if (!req.user) {
    console.error(
      'Google callback reached without req.user. This indicates an issue with Passport setup or an unexpected OAuth flow interruption.',
    );
    return res
      .status(401)
      .redirect(
        `${config.clientUrl}/login-error?message=authentication_payload_missing`,
      );
  }
  const { accessToken, refreshToken } = req.user as AuthTokens;
  const state = req.query.state as string;

  try {
    const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
    const { rn, rn2 } = decodedState;

    if (rn2) {
      return res.redirect(
        `${
          config.prod
            ? `vsnip://`
            : `exp://${config.serverUrl.replace('http://', '').split(':')[0]}:19000/--/`
        }tokens2/${accessToken}/${refreshToken}`,
      );
    }
    if (rn) {
      return res.redirect(
        `${
          config.prod
            ? `vsnip://`
            : `exp://${config.serverUrl.replace('http://', '').split(':')[0]}:19000/--/`
        }tokens/${accessToken}/${refreshToken}`,
      );
    }
    return res.redirect(
      `${config.clientUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`,
    );
  } catch (error) {
    console.error('Error processing state in Google callback:', error);
    return res.redirect(
      `${config.clientUrl}/login-error?message=state_processing_failed`,
    );
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ user: null, message: 'Not authenticated' });
  }
  try {
    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.userId));

    if (!userRecord) {
      return res.status(404).json({ user: null, message: 'User not found' });
    }
    const { tokenVersion, googleId, ...safeUser } = userRecord;
    return res.json({ user: safeUser });
  } catch (error) {
    console.error('Error fetching /me:', error);
    return res
      .status(500)
      .json({ user: null, message: 'Internal server error' });
  }
};
