import { sign } from 'jsonwebtoken';
import type { User } from '../schema';
import { config } from '../config';
import type { AuthTokens } from '../controllers/auth.controller';

export const generateAuthTokens = (user: User): AuthTokens => {
  if (!config.refreshTokenSecret || !config.accessTokenSecret) {
    throw new Error('Token secrets are not configured.');
  }
  const refreshToken = sign(
    { userId: user.id, tokenVersion: user.tokenVersion },
    config.refreshTokenSecret,
    {
      expiresIn: '14d',
    },
  );
  const accessToken = sign({ userId: user.id }, config.accessTokenSecret, {
    expiresIn: '15min',
  });

  return { refreshToken, accessToken };
};
