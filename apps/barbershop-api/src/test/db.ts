import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll } from "vitest";
import type { Db } from "../db/client";
import * as schema from "../db/schema";

/*
 * Database tests run against DATABASE_URL (`db:up` + `db:migrate` first).
 * Each one runs inside a transaction that is always rolled back, so nothing
 * it writes is left behind, and the seeded dev data stays as it was. Code
 * under test that opens its own transaction gets a savepoint inside this one.
 */

const url = process.env.DATABASE_URL;
if (!url)
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.");

const pool = new Pool({ connectionString: url });
const db = drizzle(pool, { schema });
afterAll(() => pool.end());

/** Thrown to end the transaction with a rollback once the test is done. */
class RollBack extends Error {}

export async function inRolledBackTransaction(run: (db: Db) => Promise<void>) {
  try {
    await db.transaction(async (tx) => {
      await run(tx);
      throw new RollBack();
    });
  } catch (error) {
    if (!(error instanceof RollBack)) throw error;
  }
}
