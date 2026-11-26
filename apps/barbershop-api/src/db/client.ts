import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import { drizzle } from "drizzle-orm/node-postgres";
import type { PgDatabase } from "drizzle-orm/pg-core";
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

/**
 * Any Drizzle database with this schema: the pool-backed one, or a
 * transaction. Code that opens its own transaction on a transaction gets a
 * savepoint, so it nests: that's how tests run routes inside a transaction
 * they always roll back.
 */
export type Db = PgDatabase<NodePgQueryResultHKT, typeof schema>;
