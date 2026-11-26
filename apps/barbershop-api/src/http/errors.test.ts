import { describe, expect, it } from "vitest";
import { bookings } from "../db/schema";
import { inRolledBackTransaction } from "../test/db";
import { addBarberAndService } from "../test/fixtures";
import { loggableError } from "./errors";

const PHONE = "+15559876543";

describe("loggableError", () => {
  it("keeps a failed query's code but not the guest data it was run with", () =>
    inRolledBackTransaction(async (db) => {
      const ids = await addBarberAndService(db);
      const failure = await db
        .insert(bookings)
        .values({
          ...ids,
          reference: "TEST-LOG1",
          during: {
            start: new Date("2026-12-01T14:00:00Z"),
            end: new Date("2026-12-01T14:30:00Z"),
          },
          priceCents: -1, // breaks the bookings_price check
          durationMinutes: 30,
          customerName: "Alex Guest",
          customerPhone: PHONE,
        })
        .then(
          () => undefined,
          (error: unknown) => error,
        );

      // The raw error does carry the phone, which is why it isn't logged.
      expect(String((failure as Error).message)).toContain(PHONE);

      const logged = JSON.stringify(loggableError(failure));
      expect(logged).not.toContain(PHONE);
      expect(logged).not.toContain("Alex Guest");
      expect(loggableError(failure)).toMatchObject({
        code: "23514",
        constraint: "bookings_price",
      });
    }));
});
