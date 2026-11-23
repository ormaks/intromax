import { eq } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { afterAll, describe, expect, it } from "vitest";
import * as schema from "./schema";
import type { TimeRange } from "./tstzrange";

/*
 * Runs against the database in DATABASE_URL (`db:up` + `db:migrate` first).
 * Every test runs inside a transaction that is always rolled back, so
 * nothing it inserts is left behind.
 */

const url = process.env.DATABASE_URL;
if (!url)
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env.");

const pool = new Pool({ connectionString: url });
afterAll(() => pool.end());

type Tx = NodePgDatabase<typeof schema>;

async function inRolledBackTransaction(run: (db: Tx) => Promise<void>) {
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

const at = (time: string) => new Date(`2026-12-01T${time}:00Z`);
const range = (from: string, to: string): TimeRange => ({
  start: at(from),
  end: at(to),
});

let referenceCounter = 0;

async function addBarberAndService(db: Tx) {
  const [barber] = await db
    .insert(schema.barbers)
    .values({ name: "Test Barber" })
    .returning();
  const [service] = await db
    .insert(schema.services)
    .values({ name: "Cut", durationMinutes: 30, priceCents: 2500 })
    .returning();
  if (!barber || !service) throw new Error("Fixture insert returned nothing");
  return { barberId: barber.id, serviceId: service.id };
}

function book(
  db: Tx,
  ids: { barberId: string; serviceId: string },
  during: TimeRange,
) {
  return db.insert(schema.bookings).values({
    ...ids,
    reference: `TEST-${++referenceCounter}`,
    during,
    priceCents: 2500,
    durationMinutes: (during.end.getTime() - during.start.getTime()) / 60_000,
    customerName: "Guest",
    customerPhone: "+15550000",
  });
}

/** Postgres's error code for an exclusion constraint violation. */
const EXCLUSION_VIOLATION = "23P01";

async function pgErrorCode(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    // Drizzle wraps the driver's error; the Postgres code is on its cause.
    const cause = (error as { cause?: { code?: string } }).cause;
    return cause?.code;
  }
  return undefined;
}

describe("bookings_no_overlap", () => {
  it("rejects a second booking that overlaps the first for the same barber", () =>
    inRolledBackTransaction(async (db) => {
      const ids = await addBarberAndService(db);
      await book(db, ids, range("10:00", "10:30"));

      expect(await pgErrorCode(book(db, ids, range("10:15", "10:45")))).toBe(
        EXCLUSION_VIOLATION,
      );
    }));

  it("allows back-to-back bookings, because a range excludes its end", () =>
    inRolledBackTransaction(async (db) => {
      const ids = await addBarberAndService(db);
      await book(db, ids, range("10:00", "10:30"));
      await book(db, ids, range("10:30", "11:00"));
    }));

  it("allows the same time with a different barber", () =>
    inRolledBackTransaction(async (db) => {
      const ids = await addBarberAndService(db);
      const other = await addBarberAndService(db);
      await book(db, ids, range("10:00", "10:30"));
      await book(db, other, range("10:00", "10:30"));
    }));

  it("frees the slot when a booking is cancelled", () =>
    inRolledBackTransaction(async (db) => {
      const ids = await addBarberAndService(db);
      const [first] = await book(db, ids, range("10:00", "10:30")).returning();
      if (!first) throw new Error("Booking insert returned nothing");

      await db
        .update(schema.bookings)
        .set({ status: "cancelled", cancelledAt: new Date() })
        .where(eq(schema.bookings.id, first.id));
      await book(db, ids, range("10:00", "10:30"));
    }));
});
