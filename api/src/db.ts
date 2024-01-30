import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import * as schema from "./schema";
import { __prod__ } from "./constants";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL as string,
  ssl: __prod__,
});

export const db = drizzle(pool, { schema });
