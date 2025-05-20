import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import http from 'node:http';
import passport from 'passport';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { and, desc, eq, or, sql } from 'drizzle-orm';
import type WebSocket from 'ws';
import { Server } from 'ws';
import url from 'node:url';

import { db } from './db';
import { conversationEntity, messageEntity, users } from './schema';
import { __prod__ } from './constants';
import { createTokens, isAuth } from './auth';
import { getUserIdOrder } from './utils';
import createHttpError from 'http-errors';
import { verify } from 'jsonwebtoken';

(async () => {
  console.log('Running migrations');

  await migrate(db, { migrationsFolder: 'drizzle' });
  console.log('Migrated successfully');

  const wsUsers: Record<
    string,
    { ws: WebSocket; openChatUserId: string | null }
  > = {};

  const wsSend = (key: string, v: any) => {
    if (key in wsUsers) {
      wsUsers[key].ws.send(JSON.stringify(v));
    }
  };

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
        clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        callbackURL: `${process.env.SERVER_URL}/auth/google/callback`,
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, cb) => {
        try {
          let [user] = await db
            .select()
            .from(users)
            .where(eq(users.googleId, profile.id))
            .limit(1);

          if (profile.photos && profile.emails) {
            if (user) {
              [user] = await db
                .update(users)
                .set({
                  avatar: profile.photos[0].value,
                  email: profile.emails[0].value,
                  googleId: profile.id,
                  username: profile.displayName,
                })
                .where(eq(users.googleId, profile.id))
                .returning();
            } else {

              [user] = await db
                .insert(users)
                .values({
                  username: profile.displayName,
                  avatar: profile.photos[0].value,
                  googleId: profile.id,
                  email: profile.emails[0].value,
                })
                .returning();
            }
          }

          cb(null, createTokens(user));
        } catch (err) {
          console.log(err);
          cb(new Error('Internal server error'));
        }
      },
    ),
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.accessToken);
  });

  const app = express();

  app.set('trust proxy', 1);

  app.use(
    cors({
      origin: '*',
      maxAge: __prod__ ? 86400 : undefined,
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

  app.get('/auth/google', (req, res, next) => {
    const state = Buffer.from(JSON.stringify({ rn: false })).toString('base64');
    passport.authenticate('google', {
      session: false,
      state,
    })(req, res, next);
  });

  app.get(
    '/auth/google/callback',
    passport.authenticate('google', { session: false }),
    (req: any, res) => {
      if (!req.user.accessToken || !req.user.refreshToken) {
        res.send(`something went wrong`);
        return;
      }

      const { state } = req.query;
      const { rn, rn2 } = JSON.parse(Buffer.from(state, 'base64').toString());
      if (rn2) {
        res.redirect(
          `${__prod__
            ? `vsnip://`
            : `exp:${process.env.SERVER_URL.replace('http:', '').split(':')[0]
            }:19000/--/`
          }tokens2/${req.user.accessToken}/${req.user.refreshToken}`,
        );
      } else if (rn) {
        res.redirect(
          `${__prod__
            ? `vsnip://`
            : `exp:${process.env.SERVER_URL.replace('http:', '').split(':')[0]
            }:19000/--/`
          }tokens/${req.user.accessToken}/${req.user.refreshToken}`,
        );
      } else {
        res.redirect(
          `http://localhost:54321/callback/${req.user.accessToken}/${req.user.refreshToken}`,
        );
      }
    },
  );

  app.get('/me', isAuth(false), async (req: any, res) => {
    if (!req.userId) {
      res.json({
        user: null,
      });
      return;
    }
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.userId));

    res.json({
      user,
    });
  });

  app.get('/feed', isAuth(), async (req: any, res) => {
    const userId = req.userId;

    const users = await db.execute(
      sql`select * from users where id != ${userId}`,
    );

    return res.json({ profiles: users.rows });
  });

  app.get('/conversations/:cursor', isAuth(), async (req: any, res) => {
    const userId = req.userId;

    const conv = await db.execute(sql`
    select
    case
      when u.id = co."userId1" then co.read2
      else co.read1
    end "read",
    co.id "conversationId",
    u.id "userId", u."username", u."avatar", date_part('epoch', co."created_at") * 1000 "created_at",
    (select json_build_object('text',
    case when char_length(text) > 40
    then substr(text, 0, 40) || '...'
    else text
    end
    , 'created_at', date_part('epoch', m."created_at")*1000)
    from messages m
    where (m.recipient_id = co."userId1" and m."sender_id" = co."userId2")
    or
    (m."sender_id" = co."userId1" and m.recipient_id = co."userId2")
    order by m."created_at" desc limit 1) message
    from conversations co
    inner join "users" u on u.id != ${userId} and (u.id = co."userId1" or u.id = co."userId2")
    where (co."userId1" = ${userId} or co."userId2" = ${userId}) and co.unfriended = false
    limit 150`);

    res.json({ conversations: conv.rows });
  });

  app.post('/conversation', isAuth(), async (req: any, res) => {
    const { userId } = req.body;

    const already_exists = await db
      .select()
      .from(conversationEntity)
      .where(
        or(
          and(
            eq(conversationEntity.userId1, userId),
            eq(conversationEntity.userId2, req.userId),
          ),
          and(
            eq(conversationEntity.userId1, req.userId),
            eq(conversationEntity.userId2, userId),
          ),
        ),
      );

    if (already_exists[0]) {
      return res.json({ conv: already_exists[0], ok: true });
    }

    const conv = await db
      .insert(conversationEntity)
      .values(getUserIdOrder(userId, req.userId))
      .returning();

    return res.json({ conv: conv[0], ok: true });
  });

  app.get(
    '/messages/:userId/:cursor?',
    isAuth(),
    async (req: any, res, next) => {
      try {
        req.params.cursor = req.params.cursor
          ? Number.parseInt(req.params.cursor)
          : undefined;
      } catch (err) {
        next(createHttpError(400, err.message));
        return;
      }

      const { userId } = req.params;

      const messages = await db
        .select()
        .from(messageEntity)
        .where(
          or(
            and(
              eq(messageEntity.recipientId, userId),
              eq(messageEntity.senderId, req.userId),
            ),
            and(
              eq(messageEntity.senderId, userId),
              eq(messageEntity.recipientId, req.userId),
            ),
          ),
        )

        .limit(21)
        .orderBy(desc(messageEntity.createdAt));

      res.json({
        messages: messages.slice(0, 20),
        hasMore: messages.length === 21,
      });
    },
  );

  if (!__prod__) {
    app.post('/dev/user', async (req, res) => {
      const { email, bio, username, avatar } = req.body;

      const [user] = await db
        .insert(users)
        .values({ username, email, bio, avatar })
        .returning();

      return res.json(user);
    });
  }

  app.post('/message', isAuth(), async (req: any, res) => {
    const { conversationId, recipientId, text } = req.body;
    const [m] = await db
      .insert(messageEntity)
      .values({ conversationId, recipientId, text, senderId: req.userId })
      .returning();

    if (!m.recipientId) {
      return createHttpError(400, 'Not authorized');
    }

    wsSend(m.recipientId, { type: 'new-message', message: m });

    if (
      !(m.recipientId in wsUsers) ||
      wsUsers[m.recipientId].openChatUserId !== req.userId
    ) {
      const userIdOrder = getUserIdOrder(req.userId, m.recipientId);
      await db
        .update(conversationEntity)
        .set({
          unfriended: false,
          ...userIdOrder,
          [userIdOrder.userId1 === m.recipientId ? 'read1' : 'read2']: false,
        })
        .where(eq(conversationEntity.id, conversationId));
    }

    return res.json({ message: m });
  });

  app.put('/user', isAuth(), async (req: any, res) => {
    const { email, username } = req.body;

    if (!email || !username) {
      return createHttpError(400, 'Not authorized');
    }

    const [user] = await db
      .update(users)
      .set({ email, username })
      .where(eq(users.id, req.userId))
      .returning();

    return res.json({ user });
  });

  app.get('/user/:id', isAuth(), async (req: any, res) => {
    const { id } = req.params;

    if (!id) {
      return createHttpError(402, 'You must provide the ID');
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));

    return res.json(user);
  });


  const server = http.createServer(app);
  const wss = new Server({ noServer: true });

  wss.on('connection', (ws: WebSocket, userId: string) => {
    if (!userId) {
      ws.terminate();
    }

    wsUsers[userId] = { openChatUserId: null, ws };

    ws.on('message', (e: any) => {
      const {
        type,
        userId: openChatUserId,
      }: { type: 'message-open'; userId: string } = JSON.parse(e);

      if (type === 'message-open') {
        if (userId in wsUsers) {
          wsUsers[userId].openChatUserId = openChatUserId;
        }
      }
    });

    ws.on('close', () => {
      delete wsUsers[userId];
    });
  });

  server.on('upgrade', async function upgrade(request, socket, head) {
    const good = (userId: string) => {
      wss.handleUpgrade(request, socket, head, function done(ws) {
        wss.emit('connection', ws, userId);
      });
    };

    const bad = () => {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
    };

    try {
      const {
        query: { accessToken, refreshToken },
      } = url.parse(request.url as string, true);

      if (
        !accessToken ||
        !refreshToken ||
        typeof accessToken !== 'string' ||
        typeof refreshToken !== 'string'
      ) {
        return bad();
      }

      try {
        const data = verify(
          accessToken,
          process.env.ACCESS_TOKEN_SECRET,
        ) as any;

        return good(data.userId);
      } catch { }

      try {
        const data = verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET as string,
        ) as any;
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, data.userId));

        if (!user || user.tokenVersion !== data.tokenVersion) {
          return bad();
        }

        return good(data.userId);
      } catch { }
    } catch { }
  });

  server.listen(
    process.env.PORT ? Number.parseInt(process.env.PORT) : 4000,
    () => {
      console.log('Server started');
    },
  );
})();
