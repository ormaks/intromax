import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll } from "vitest";
import type { Db } from "../db/client";
import * as schema from "../db/schema";

/*
 * Database tests run against DATABASE_URL (`db:up` + `db:migrate` first).
 * Each one runs inside a transaction that is always rolled back, so nothing
 * it writes is left behind, and the seeded dev data stays as it was.
 */

const url = process.env.DATABASE_URL;
if (!url)
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.");

const pool = new Pool({ connectionString: url });
afterAll(() => pool.end());

export async function inRolledBackTransaction(run: (db: Db) => Promise<void>) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await run(drizzle(client, { schema }));
  } finally {
    try {
      await client.query("ROLLBACK");
    } finally {
      client.release();
    }
  }
}
