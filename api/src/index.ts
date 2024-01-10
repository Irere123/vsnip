require("dotenv-safe").config();
import cors from "cors";
import express from "express";
import passport from "passport";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createClient } from "redis";
import RedisStore from "connect-redis";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { eq } from "drizzle-orm";

import { db } from "./db";
import { userEntity } from "./schema";
import { __prod__ } from "./constants";
import { createTokens, isAuth } from "./auth";

(async () => {
  console.log("Running migrations");

  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Migrated successfully");

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_OAUTH_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
        callbackURL: `${process.env.SERVER_URL}/auth/google/callback`,
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, cb) => {
        try {
          let users = await db
            .select()
            .from(userEntity)
            .where(eq(userEntity.googleId, profile.id))
            .limit(1);

          if (users[0]) {
            users = await db
              .update(userEntity)
              .set({
                avatar: profile.photos![0].value,
                email: profile.emails![0].value,
                googleId: profile.id,
                username: profile.displayName,
              })
              .returning();
          } else {
            users = await db
              .insert(userEntity)
              .values({
                username: profile.displayName,
                avatar: profile.photos![0].value,
                googleId: profile.id,
                email: profile.emails![0].value,
              })
              .returning();
          }

          cb(null, createTokens(users[0]));
        } catch (err) {
          console.log(err);
          cb(new Error("Internal server error"));
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.accessToken);
  });

  const app = express();

  app.set("trust proxy", 1);

  // Initialize client.
  let redisClient = createClient();
  redisClient.connect().catch(console.error);

  // Initialize store.
  let redisStore = new RedisStore({
    client: redisClient,
  });

  app.use(
    cors({
      origin: "*",
      maxAge: __prod__ ? 86400 : undefined,
      exposedHeaders: [
        "access-token",
        "refresh-token",
        "content-type",
        "content-length",
      ],
    })
  );

  app.use(express.json());
  app.use(passport.initialize());

  app.get("/auth/google", (req, res, next) => {
    const state = Buffer.from(JSON.stringify({ rn: false })).toString("base64");
    passport.authenticate("google", {
      session: false,
      state,
    })(req, res, next);
  });

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { session: false }),
    (req: any, res) => {
      if (!req.user.accessToken || !req.user.refreshToken) {
        res.send(`something went wrong`);
        return;
      }

      const { state } = req.query;
      const { rn, rn2 } = JSON.parse(Buffer.from(state, "base64").toString());
      if (rn2) {
        res.redirect(
          `${
            __prod__
              ? `vsnip://`
              : `exp:${
                  process.env.SERVER_URL!.replace("http:", "").split(":")[0]
                }:19000/--/`
          }tokens2/${req.user.accessToken}/${req.user.refreshToken}`
        );
      } else if (rn) {
        res.redirect(
          `${
            __prod__
              ? `vsnip://`
              : `exp:${
                  process.env.SERVER_URL!.replace("http:", "").split(":")[0]
                }:19000/--/`
          }tokens/${req.user.accessToken}/${req.user.refreshToken}`
        );
      } else {
        res.redirect(
          `http://localhost:54321/callback/${req.user.accessToken}/${req.user.refreshToken}`
        );
      }
    }
  );

  app.get("/me", isAuth(false), async (req: any, res) => {
    if (!req.userId) {
      res.json({
        user: null,
      });
      return;
    }
    const users = await db
      .select()
      .from(userEntity)
      .where(eq(userEntity.id, req.userId));

    res.json({
      user: users[0],
    });
  });

  app.listen(4000, () => {
    console.log("Srever started at localhost:4000");
  });
})();
