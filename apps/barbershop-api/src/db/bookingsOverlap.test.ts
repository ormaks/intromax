import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { inRolledBackTransaction } from "../test/db";
import { addBarberAndService, book } from "../test/fixtures";
import * as schema from "./schema";
import type { TimeRange } from "./tstzrange";

const at = (time: string) => new Date(`2026-12-01T${time}:00Z`);
const range = (from: string, to: string): TimeRange => ({
  start: at(from),
  end: at(to),
});

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
