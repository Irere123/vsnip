import { sign, verify } from "jsonwebtoken";
import { User, userEntity } from "./schema";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { db } from "./db";
import { eq } from "drizzle-orm";

export type RefreshTokenData = {
  userId: string;
  tokenVersion?: number;
};

export type AccessTokenData = {
  userId: string;
};

export const createTokens = (
  user: User
): { refreshToken: string; accessToken: string } => {
  const refreshToken = sign(
    { userId: user.id, tokenVersion: user.tokenVersion },
    process.env.REFRESH_TOKEN_SECRET!,
    {
      expiresIn: "14d",
    }
  );
  const accessToken = sign(
    { userId: user.id },
    process.env.ACCESS_TOKEN_SECRET!,
    {
      expiresIn: "15min",
    }
  );

  return { refreshToken, accessToken };
};

export const isAuth: (st?: boolean) => RequestHandler<{}, any, any> =
  (shouldThrow = true) =>
  async (req: any, res: Response, next: NextFunction): Promise<void> => {
    const accessToken = req.headers["access-token"];

    if (typeof accessToken !== "string") {
      return next(shouldThrow && Error("not authenticated"));
    }
    let data;
    try {
      data = <AccessTokenData>(
        verify(accessToken, process.env.ACCESS_TOKEN_SECRET!)
      );
      req.userId = data.userId;

      return next();
    } catch {
      return next(shouldThrow && Error("not authenticated"));
    }

    const users = await db
      .select()
      .from(userEntity)
      .where(eq(userEntity.id, data.userId));

    if (!users[0] || users[0].tokenVersion !== data.tokenVersion) {
      return next(shouldThrow && Error("not authenticated"));
    }

    const tokens = createTokens(users[0]);

    res.setHeader("refresh-token", tokens.refreshToken);
    res.setHeader("access-token", tokens.accessToken);
    req.userId = data.userId;

    next();
  };
