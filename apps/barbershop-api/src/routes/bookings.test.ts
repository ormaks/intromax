import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { App } from "../app";
import type { Db } from "../db/client";
import { bookings } from "../db/schema";
import { withApp } from "../test/app";
import { addTuesdayBarber, book, NOW } from "../test/fixtures";

const withFixedClock = { now: () => NOW };

function bookingRequest(
  ids: { barberId: string; serviceId: string },
  start: string,
) {
  return {
    method: "POST" as const,
    url: "/v1/bookings",
    payload: {
      ...ids,
      start,
      name: "Alex Guest",
      phone: "+1 (555) 234-5678",
    },
  };
}

describe("POST /v1/bookings", () => {
  it("creates a confirmed booking with snapshots and a reference", () =>
    withApp(async (app, db) => {
      const ids = await addTuesdayBarber(db);

      // 09:00 in New York.
      const res = await app.inject(
        bookingRequest(ids, "2026-12-01T14:00:00.000Z"),
      );
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body).toMatchObject({
        status: "confirmed",
        start: "2026-12-01T14:00:00.000Z",
        end: "2026-12-01T14:30:00.000Z",
        date: "2026-12-01",
        label: "09:00",
        service: { id: ids.serviceId, name: "Cut" },
        priceCents: 2500,
        durationMinutes: 30,
        customerName: "Alex Guest",
      });
      expect(body.reference).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}$/);
      expect(body).not.toHaveProperty("phone");

      const [row] = await db
        .select()
        .from(bookings)
        .where(eq(bookings.reference, body.reference));
      expect(row?.customerPhone).toBe("+15552345678");
    }, withFixedClock));

  it("answers 422 slot_unavailable for a start that isn't offered", () =>
    withApp(async (app, db) => {
      const ids = await addTuesdayBarber(db);

      // 09:10 is off the 15-minute grid.
      const res = await app.inject(
        bookingRequest(ids, "2026-12-01T14:10:00.000Z"),
      );
      expect(res.statusCode).toBe(422);
      expect(res.json().error.code).toBe("slot_unavailable");
    }, withFixedClock));

  it("answers 409 slot_taken when the time overlaps a live booking", () =>
    withApp(async (app, db) => {
      const ids = await addTuesdayBarber(db);
      await book(db, ids, {
        start: new Date("2026-12-01T14:00:00Z"),
        end: new Date("2026-12-01T14:30:00Z"),
      });

      const res = await app.inject(
        bookingRequest(ids, "2026-12-01T14:00:00.000Z"),
      );
      expect(res.statusCode).toBe(409);
      expect(res.json().error.code).toBe("slot_taken");
    }, withFixedClock));
});

describe("POST /v1/bookings/lookup and /cancel", () => {
  /** Books Tuesday 09:00 (14:00Z) through the API and returns its reference. */
  async function bookNineAm(app: App, db: Db): Promise<string> {
    const ids = await addTuesdayBarber(db);
    const res = await app.inject(
      bookingRequest(ids, "2026-12-01T14:00:00.000Z"),
    );
    return res.json().reference;
  }

  function access(path: "lookup" | "cancel", reference: string, phone: string) {
    return {
      method: "POST" as const,
      url: `/v1/bookings/${path}`,
      payload: { reference, phone },
    };
  }

  it("finds the booking however the reference and phone are typed", () =>
    withApp(async (app, db) => {
      const reference = await bookNineAm(app, db);

      const res = await app.inject(
        access(
          "lookup",
          reference.toLowerCase().replace("-", " "),
          "+15552345678",
        ),
      );
      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ reference, status: "confirmed" });
    }, withFixedClock));

  it("answers a wrong phone exactly like an unknown reference", () =>
    withApp(async (app, db) => {
      const reference = await bookNineAm(app, db);

      const wrongPhone = await app.inject(
        access("lookup", reference, "+15550000000"),
      );
      const unknown = await app.inject(
        access("lookup", "ZZZZ-ZZZZ", "+15552345678"),
      );
      expect(wrongPhone.statusCode).toBe(404);
      expect(wrongPhone.json()).toEqual(unknown.json());
    }, withFixedClock));

  it("cancels a confirmed booking once, then refuses", () =>
    withApp(async (app, db) => {
      const reference = await bookNineAm(app, db);

      const first = await app.inject(
        access("cancel", reference, "+1 555 234 5678"),
      );
      expect(first.statusCode).toBe(200);
      expect(first.json().status).toBe("cancelled");

      const again = await app.inject(
        access("cancel", reference, "+1 555 234 5678"),
      );
      expect(again.statusCode).toBe(409);
      expect(again.json().error.code).toBe("not_cancellable");
    }, withFixedClock));

  it("still cancels at exactly 2 hours before, and frees the slot", () => {
    let clock = NOW;
    return withApp(
      async (app, db) => {
        const reference = await bookNineAm(app, db);

        clock = new Date("2026-12-01T12:00:00Z"); // exactly 2 hours before.
        const res = await app.inject(
          access("cancel", reference, "+15552345678"),
        );
        expect(res.statusCode).toBe(200);

        // The cutoff only limits cancelling; book the freed 09:00 well ahead.
        clock = NOW;
        const ids = {
          barberId: res.json().barber.id,
          serviceId: res.json().service.id,
        };
        const rebooked = await app.inject(
          bookingRequest(ids, "2026-12-01T14:00:00.000Z"),
        );
        expect(rebooked.statusCode).toBe(201);
      },
      { now: () => clock },
    );
  });

  it("refuses to cancel within 2 hours of the start", () => {
    let clock = NOW;
    return withApp(
      async (app, db) => {
        const reference = await bookNineAm(app, db);

        clock = new Date("2026-12-01T12:30:00Z"); // 1.5 hours before.
        const res = await app.inject(
          access("cancel", reference, "+15552345678"),
        );
        expect(res.statusCode).toBe(409);
        expect(res.json().error.code).toBe("not_cancellable");
      },
      { now: () => clock },
    );
  });
});

describe("rate limits", () => {
  it("answers 429 in the error shape after 10 lookups a minute", () =>
    withApp(async (app) => {
      const lookup = () =>
        app.inject({
          method: "POST",
          url: "/v1/bookings/lookup",
          payload: { reference: "ZZZZ-ZZZZ", phone: "+15552345678" },
        });

      for (let i = 0; i < 10; i++) {
        expect((await lookup()).statusCode).toBe(404);
      }
      const blocked = await lookup();
      expect(blocked.statusCode).toBe(429);
      expect(blocked.json().error.code).toBe("too_many_requests");
    }, withFixedClock));
});
