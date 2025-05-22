import express from 'express';
import http from 'node:http';
import cors from 'cors';
import passport from 'passport';
import { apiReference } from '@scalar/express-api-reference';
import path from 'node:path';
import { config } from './config';
import { initializePassport } from './auth';
import mainRouter from './routes';

const app = express();

// Trust proxy to allow for accurate IP determination if behind a proxy
app.set('trust proxy', 1);

app.use(
  cors({
    origin: '*',
    maxAge: config.prod ? 86400 : undefined,
    exposedHeaders: [
      'access-token',
      'refresh-token',
      'content-type',
      'content-length',
    ],
  }),
);

app.use(express.json());
app.use(passport.initialize());
initializePassport();

app.get('/openapi.json', (_req, res) => {
  const openapiPath =
    process.env.NODE_ENV === 'production'
      ? path.resolve(__dirname, '../openapi.json')
      : path.resolve(__dirname, '../openapi.json');
  res.sendFile(openapiPath);
});

app.use(
  '/reference',
  apiReference({
    spec: {
      url: '/openapi.json',
    },
  }),
);

app.use('/', mainRouter);

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error(err);
    if (res.headersSent) {
      return next(err);
    }
    res
      .status(err.status || 500)
      .json({ message: err.message || 'Internal Server Error' });
  },
);

const createServer = () => {
  return http.createServer(app);
};

export { app, createServer };
