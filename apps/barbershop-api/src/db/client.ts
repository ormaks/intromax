import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * A pool keeps a few Postgres connections open and lends one to each query,
 * instead of paying for a new connection (TCP + auth) every time.
 * Call `pool.end()` when a script is done, or Node keeps running.
 */
export function createDb(url: string) {
  const pool = new Pool({ connectionString: url });
  return { db: drizzle(pool, { schema }), pool };
}

/** Any Drizzle database with this schema: pool-backed, or one connection. */
export type Db = NodePgDatabase<typeof schema>;
