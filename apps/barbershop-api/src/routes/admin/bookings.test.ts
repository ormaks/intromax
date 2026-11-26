import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Db } from "../../db/client";
import { bookings, services } from "../../db/schema";
import { signInAsAdmin, withApp } from "../../test/app";
import { addTuesdayBarber, book, NOW } from "../../test/fixtures";

// Fixture barbers work Tuesdays 09:00-11:00 in New York (UTC-5 in December):
// 09:00 local is 14:00Z on 2026-12-01.
const at = (utc: string) => new Date(`2026-12-01T${utc}:00Z`);
const slot = (from: string, to: string) => ({ start: at(from), end: at(to) });

/** A clock the test can move; starts at the fixtures' NOW. */
function movableClock() {
  const clock = { now: NOW };
  return { clock, deps: { now: () => clock.now } };
}

async function idOf(db: Db, customerName: string) {
  const [row] = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(eq(bookings.customerName, customerName));
  if (!row) throw new Error(`No booking for ${customerName}`);
  return row.id;
}

describe("the bookings table", () => {
  it("filters by barber, date, status and a search, newest first", () =>
    withApp(
      async (app, db) => {
        const admin = await signInAsAdmin(app, db, NOW);
        const ids = await addTuesdayBarber(db);
        await book(db, ids, slot("14:00", "14:30"), {
          customerName: "Alice Early",
          customerPhone: "+15551234567",
        });
        await book(db, ids, slot("15:00", "15:30"), {
          customerName: "Bob Late",
        });

        const mine = `barberId=${ids.barberId}`;
        const all = await admin(
          "GET",
          `/bookings?${mine}&from=2026-12-01&to=2026-12-01`,
        );
        expect(all.statusCode).toBe(200);
        expect(all.json()).toMatchObject({ total: 2, page: 1, pageSize: 25 });
        expect(
          all
            .json()
            .bookings.map((b: { customerName: string }) => b.customerName),
        ).toEqual(["Bob Late", "Alice Early"]);

        for (const q of ["alice", "1234567"]) {
          const found = await admin("GET", `/bookings?${mine}&q=${q}`);
          expect([q, found.json().total]).toEqual([q, 1]);
        }
        const nextDay = await admin("GET", `/bookings?${mine}&from=2026-12-02`);
        expect(nextDay.json().total).toBe(0);
        const done = await admin("GET", `/bookings?${mine}&status=completed`);
        expect(done.json().total).toBe(0);

        const bad = await admin(
          "GET",
          "/bookings?from=2026-12-02&to=2026-12-01",
        );
        expect(bad.statusCode).toBe(422);
      },
      { now: () => NOW },
    ));

  it("shows one booking with the guest's contact details", () =>
    withApp(
      async (app, db) => {
        const admin = await signInAsAdmin(app, db, NOW);
        const ids = await addTuesdayBarber(db);
        await book(db, ids, slot("14:00", "14:30"), {
          customerName: "Alice Early",
          customerPhone: "+15551234567",
        });

        const res = await admin(
          "GET",
          `/bookings/${await idOf(db, "Alice Early")}`,
        );
        expect(res.statusCode).toBe(200);
        expect(res.json()).toMatchObject({
          customerPhone: "+15551234567",
          label: "09:00",
          status: "confirmed",
          completedAt: null,
        });
      },
      { now: () => NOW },
    ));
});

describe("editing a booking", () => {
  it("moves it within the schedule, even sooner than guests may book", () => {
    const { clock, deps } = movableClock();
    return withApp(async (app, db) => {
      const admin = await signInAsAdmin(app, db, NOW);
      const ids = await addTuesdayBarber(db);
      await book(db, ids, slot("15:30", "16:00"), { customerName: "Mover" });
      const id = await idOf(db, "Mover");

      // 09:10 on the day: 09:30 is 20 minutes away, too soon for a guest.
      clock.now = at("14:10");
      const moved = await admin("PATCH", `/bookings/${id}`, {
        start: "2026-12-01T14:30:00.000Z",
      });
      expect(moved.statusCode).toBe(200);
      expect(moved.json()).toMatchObject({ label: "09:30" });

      const guest = await app.inject({
        method: "POST",
        url: "/v1/bookings",
        payload: {
          ...ids,
          start: "2026-12-01T14:45:00.000Z",
          name: "Walk-in",
          phone: "+15550001111",
        },
      });
      expect(guest.statusCode).toBe(422);

      // The past and off-grid times stay out of bounds.
      for (const start of [
        "2026-12-01T14:00:00.000Z",
        "2026-12-01T14:40:00.000Z",
      ]) {
        const res = await admin("PATCH", `/bookings/${id}`, { start });
        expect([start, res.json().error.code]).toEqual([
          start,
          "slot_unavailable",
        ]);
      }
    }, deps);
  });

  it("re-copies price and duration when the service changes", () =>
    withApp(
      async (app, db) => {
        const admin = await signInAsAdmin(app, db, NOW);
        const ids = await addTuesdayBarber(db);
        const [longer] = await db
          .insert(services)
          .values({ name: "Long Cut", durationMinutes: 60, priceCents: 4000 })
          .returning();
        await book(db, ids, slot("14:00", "14:30"), {
          customerName: "Upgrade",
        });

        const res = await admin(
          "PATCH",
          `/bookings/${await idOf(db, "Upgrade")}`,
          { serviceId: longer?.id },
        );
        expect(res.statusCode).toBe(200);
        expect(res.json()).toMatchObject({
          service: { name: "Long Cut" },
          priceCents: 4000,
          durationMinutes: 60,
          end: "2026-12-01T15:00:00.000Z",
        });
      },
      { now: () => NOW },
    ));

  it("refuses an overlap, and leaves history alone", () =>
    withApp(
      async (app, db) => {
        const admin = await signInAsAdmin(app, db, NOW);
        const ids = await addTuesdayBarber(db);
        await book(db, ids, slot("14:00", "14:30"), { customerName: "First" });
        await book(db, ids, slot("15:00", "15:30"), { customerName: "Second" });
        const second = await idOf(db, "Second");

        const done = await admin("POST", `/bookings/${second}/complete`);
        expect(done.json().status).toBe("completed");
        const history = await admin("PATCH", `/bookings/${second}`, {
          notes: "too late",
        });
        expect(history.statusCode).toBe(409);
        expect(history.json().error.code).toBe("not_confirmed");

        const clash = await admin(
          "PATCH",
          `/bookings/${await idOf(db, "First")}`,
          { start: "2026-12-01T15:00:00.000Z" },
        );
        expect(clash.statusCode).toBe(409);
        expect(clash.json().error.code).toBe("slot_taken");
      },
      { now: () => NOW },
    ));
});

describe("editing with the whole form sent back", () => {
  it("doesn't re-check or re-price a booking whose schedule didn't change", () => {
    const { clock, deps } = movableClock();
    return withApp(async (app, db) => {
      const admin = await signInAsAdmin(app, db, NOW);
      const ids = await addTuesdayBarber(db);
      await book(db, ids, slot("14:00", "14:30"), {
        customerName: "Typo Nmae",
      });
      const id = await idOf(db, "Typo Nmae");
      // The catalogue price moves on, and the appointment has started.
      await db
        .update(services)
        .set({ priceCents: 9900 })
        .where(eq(services.id, ids.serviceId));
      clock.now = at("14:10");

      const res = await admin("PATCH", `/bookings/${id}`, {
        ...ids,
        start: "2026-12-01T14:00:00.000Z",
        name: "Typo Name",
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({
        customerName: "Typo Name",
        priceCents: 2500,
      });
    }, deps);
  });

  it("treats % and _ in a search as plain characters", () =>
    withApp(
      async (app, db) => {
        const admin = await signInAsAdmin(app, db, NOW);
        const ids = await addTuesdayBarber(db);
        await book(db, ids, slot("14:00", "14:30"), { customerName: "Plain" });
        const res = await admin(
          "GET",
          `/bookings?barberId=${ids.barberId}&q=%25`,
        );
        expect(res.json().total).toBe(0);
      },
      { now: () => NOW },
    ));
});

describe("completing and cancelling", () => {
  it("completes a confirmed booking once; then it can't be cancelled", () =>
    withApp(
      async (app, db) => {
        const admin = await signInAsAdmin(app, db, NOW);
        const ids = await addTuesdayBarber(db);
        // Still in the future: completing early is allowed.
        await book(db, ids, slot("14:00", "14:30"), { customerName: "Paid" });
        const id = await idOf(db, "Paid");

        const done = await admin("POST", `/bookings/${id}/complete`);
        expect(done.statusCode).toBe(200);
        expect(done.json().completedAt).toBe(NOW.toISOString());

        for (const action of ["complete", "cancel"]) {
          const again = await admin("POST", `/bookings/${id}/${action}`);
          expect(again.statusCode).toBe(409);
          expect(again.json().error.message).toBe(
            "This booking is already completed.",
          );
        }
      },
      { now: () => NOW },
    ));
});

describe("overview and analytics", () => {
  it("adds up today in shop time: counted, earned and expected", () => {
    const { clock, deps } = movableClock();
    return withApp(async (app, db) => {
      const admin = await signInAsAdmin(app, db, NOW);
      await db.delete(bookings); // only this test's bookings, rolled back after
      const ids = await addTuesdayBarber(db);
      await book(db, ids, slot("14:00", "14:30"), { customerName: "Done" });
      await book(db, ids, slot("15:00", "15:30"), {
        customerName: "Coming",
        priceCents: 3000,
      });
      await book(db, ids, slot("15:30", "16:00"), { customerName: "Gone" });
      await admin("POST", `/bookings/${await idOf(db, "Done")}/complete`);
      await admin("POST", `/bookings/${await idOf(db, "Gone")}/cancel`);

      clock.now = at("14:45"); // 09:45 in New York, on the day
      const res = await admin("GET", "/overview");
      expect(res.statusCode).toBe(200);
      expect(res.json().today).toEqual({
        date: "2026-12-01",
        bookings: 2,
        revenueCents: 2500,
        expectedCents: 3000,
      });
      expect(
        res
          .json()
          .upcoming.map((b: { customerName: string }) => b.customerName),
      ).toEqual(["Coming"]);
      expect(res.json().topService).toMatchObject({
        service: { id: ids.serviceId },
        completed: 1,
        revenueCents: 2500,
      });
    }, deps);
  });

  it("groups by the shop's calendar day and fills empty days", () =>
    withApp(
      async (app, db) => {
        const admin = await signInAsAdmin(app, db, NOW);
        await db.delete(bookings);
        const ids = await addTuesdayBarber(db);
        await book(db, ids, slot("14:00", "14:30"), {
          customerName: "Morning",
        });
        // 23:30 in New York on 1 December is already 2 December in UTC.
        await book(
          db,
          ids,
          {
            start: new Date("2026-12-02T04:30:00Z"),
            end: new Date("2026-12-02T05:00:00Z"),
          },
          { customerName: "Night" },
        );
        await admin("POST", `/bookings/${await idOf(db, "Morning")}/complete`);

        const res = await admin(
          "GET",
          "/analytics?from=2026-11-30&to=2026-12-02",
        );
        expect(res.statusCode).toBe(200);
        expect(res.json().days).toEqual([
          { date: "2026-11-30", bookings: 0, revenueCents: 0 },
          { date: "2026-12-01", bookings: 2, revenueCents: 2500 },
          { date: "2026-12-02", bookings: 0, revenueCents: 0 },
        ]);
        expect(res.json().byBarber).toEqual([
          {
            barber: { id: ids.barberId, name: "Test Barber" },
            bookings: 2,
            revenueCents: 2500,
          },
        ]);

        const tooLong = await admin(
          "GET",
          "/analytics?from=2025-01-01&to=2026-12-01",
        );
        expect(tooLong.statusCode).toBe(422);
      },
      { now: () => NOW },
    ));
});
