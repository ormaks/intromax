import type { Slot } from "@intromax/barbershop-contracts";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { bookings } from "../db/schema";
import { withApp } from "../test/app";
import {
  addTuesdayBarber as setUp,
  book,
  NOW,
  TUESDAY,
} from "../test/fixtures";

const withFixedClock = { now: () => NOW };

function url(ids: { barberId: string; serviceId: string }, date: string) {
  return `/v1/availability?serviceId=${ids.serviceId}&barberId=${ids.barberId}&date=${date}`;
}

describe("GET /v1/availability", () => {
  it("leaves out booked times, but not cancelled ones", () =>
    withApp(async (app, db) => {
      const ids = await setUp(db);
      await book(db, ids, {
        start: new Date("2026-12-01T15:00:00Z"),
        end: new Date("2026-12-01T15:30:00Z"),
      });
      const [cancelled] = await book(db, ids, {
        start: new Date("2026-12-01T14:00:00Z"),
        end: new Date("2026-12-01T14:30:00Z"),
      }).returning();
      if (!cancelled) throw new Error("Fixture insert returned nothing");
      await db
        .update(bookings)
        .set({ status: "cancelled", cancelledAt: NOW })
        .where(eq(bookings.id, cancelled.id));

      const res = await app.inject({ method: "GET", url: url(ids, TUESDAY) });
      expect(res.statusCode).toBe(200);
      const slots: Slot[] = res.json().slots;
      expect(slots.map((slot) => slot.label)).toEqual([
        "09:00",
        "09:15",
        "09:30",
        "10:30",
      ]);
      expect(slots[0]?.start).toBe("2026-12-01T14:00:00.000Z");
    }, withFixedClock));

  it("answers no slots on the barber's day off", () =>
    withApp(async (app, db) => {
      const ids = await setUp(db);
      const res = await app.inject({
        method: "GET",
        url: url(ids, "2026-12-02"),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ slots: [] });
    }, withFixedClock));

  it("answers 404 for a barber that doesn't exist", () =>
    withApp(async (app, db) => {
      const ids = await setUp(db);
      const res = await app.inject({
        method: "GET",
        url: url(
          { ...ids, barberId: "00000000-0000-4000-8000-000000000000" },
          TUESDAY,
        ),
      });
      expect(res.statusCode).toBe(404);
      expect(res.json().error.code).toBe("not_found");
    }, withFixedClock));

  it("answers 422 naming the field for an impossible date", () =>
    withApp(async (app, db) => {
      const ids = await setUp(db);
      const res = await app.inject({
        method: "GET",
        url: url(ids, "2026-02-30"),
      });
      expect(res.statusCode).toBe(422);
      expect(Object.keys(res.json().error.fields)).toEqual(["date"]);
    }, withFixedClock));
});
