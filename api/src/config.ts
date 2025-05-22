export const config = {
  googleOAuthClientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
  googleOAuthClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  serverUrl: process.env.SERVER_URL || 'http://localhost:4000',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000', // Assuming a default client URL
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL, // Assuming Redis URL is in env
  port: process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  prod: process.env.NODE_ENV === 'production',
};

// Basic validation to ensure critical variables are set
if (!config.googleOAuthClientId) {
  throw new Error('Missing GOOGLE_OAUTH_CLIENT_ID in .env');
}
if (!config.googleOAuthClientSecret) {
  throw new Error('Missing GOOGLE_OAUTH_CLIENT_SECRET in .env');
}
if (!config.accessTokenSecret) {
  throw new Error('Missing ACCESS_TOKEN_SECRET in .env');
}
if (!config.refreshTokenSecret) {
  throw new Error('Missing REFRESH_TOKEN_SECRET in .env');
}
if (!config.databaseUrl) {
  // Assuming DATABASE_URL is used by Drizzle or pg directly,
  // but good to check if it's needed for other things or for Drizzle Kit.
  // console.warn('DATABASE_URL is not explicitly set in config.ts, ensure it is set for database operations.');
}

// It's also good practice to ensure that secrets are not undefined if your logic strictly expects strings.
// For simplicity, I'm keeping it as is, but in a production app, you might add more checks
// or provide default non-secret values for development if applicable.
