import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const userEntity = pgTable("users", {
  id: uuid("id").default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  avatar: text("avatar"),
  email: text("email"),
  tokenVersion: integer("tokenVersion").default(1),
  googleId: text("google_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type User = typeof userEntity.$inferSelect;
