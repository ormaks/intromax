import { describe, expect, it } from "vitest";
import type { App } from "../../app";
import type { Db } from "../../db/client";
import { signInAsAdmin, withApp } from "../../test/app";
import { addTuesdayBarber, book, NOW, openEveryDay } from "../../test/fixtures";

const withFixedClock = { now: () => NOW };

const signedIn = (app: App, db: Db) => signInAsAdmin(app, db, NOW);

/** Tuesday 09:00-10:00 New York (14:00Z-15:00Z), the barber's day in fixtures. */
const tuesdayAt = (from: string, to: string) => ({
  start: new Date(`2026-12-01T${from}:00Z`),
  end: new Date(`2026-12-01T${to}:00Z`),
});

describe("admin routes without a session", () => {
  it("answer 401 on every route the app registers, before reading the body", () =>
    withApp(async (app) => {
      // Collected from the app itself, so a new admin route is covered too.
      const routes: { method: string; url: string }[] = [];
      app.addHook("onRoute", (route) => {
        if (!route.url.startsWith("/v1/admin")) return;
        for (const method of [route.method].flat()) {
          if (method !== "HEAD") routes.push({ method, url: route.url });
        }
      });
      await app.ready();
      expect(routes.length).toBeGreaterThanOrEqual(9);

      for (const { method, url } of routes) {
        const res = await app.inject({
          method: method as "GET",
          url: url.replaceAll(":id", "00000000-0000-4000-8000-000000000000"),
          // An invalid body: without the session check first, this is a 422.
          ...(method !== "GET" &&
            method !== "DELETE" && { payload: { nonsense: true } }),
        });
        expect([method, url, res.statusCode]).toEqual([method, url, 401]);
      }
    }, withFixedClock));
});

describe("admin services", () => {
  it("creates, lists (inactive too), edits and deletes a service", () =>
    withApp(async (app, db) => {
      const admin = await signedIn(app, db);

      const created = await admin("POST", "/services", {
        name: "Test Shave",
        durationMinutes: 20,
        priceCents: 1800,
      });
      expect(created.statusCode).toBe(201);
      const service = created.json();
      expect(service).toMatchObject({ isActive: true, description: null });

      const hidden = await admin("PATCH", `/services/${service.id}`, {
        isActive: false,
        priceCents: 1900,
      });
      expect(hidden.json()).toMatchObject({
        isActive: false,
        priceCents: 1900,
      });

      const list = await admin("GET", "/services");
      expect(list.json().services.map((s: { id: string }) => s.id)).toContain(
        service.id,
      );

      expect(
        (await admin("PATCH", `/services/${service.id}`, {})).statusCode,
      ).toBe(422);
      expect(
        (await admin("DELETE", `/services/${service.id}`)).statusCode,
      ).toBe(204);
      expect(
        (await admin("DELETE", `/services/${service.id}`)).statusCode,
      ).toBe(404);
    }, withFixedClock));

  it("refuses to delete a service that bookings use", () =>
    withApp(async (app, db) => {
      const admin = await signedIn(app, db);
      const ids = await addTuesdayBarber(db);
      await book(db, ids, tuesdayAt("15:00", "15:30"));

      const res = await admin("DELETE", `/services/${ids.serviceId}`);
      expect(res.statusCode).toBe(409);
      expect(res.json().error.code).toBe("in_use");
    }, withFixedClock));
});

describe("admin barbers", () => {
  it("creates a barber with hours inside opening hours", () =>
    withApp(async (app, db) => {
      const admin = await signedIn(app, db);
      await openEveryDay(db);

      const res = await admin("POST", "/barbers", {
        name: "Test New Barber",
        hours: [
          {
            weekday: 3,
            startsAt: "10:00",
            endsAt: "18:00",
            break: { startsAt: "13:00", endsAt: "13:30" },
          },
        ],
      });
      expect(res.statusCode).toBe(201);
      expect(res.json()).toMatchObject({
        name: "Test New Barber",
        isActive: true,
        hours: [{ weekday: 3, startsAt: "10:00", endsAt: "18:00" }],
      });
    }, withFixedClock));

  it("refuses hours outside opening hours, and creates nothing", () =>
    withApp(async (app, db) => {
      const admin = await signedIn(app, db);
      await openEveryDay(db);

      const res = await admin("POST", "/barbers", {
        name: "Test Night Owl",
        hours: [
          { weekday: 5, startsAt: "17:00", endsAt: "21:00", break: null },
        ],
      });
      expect(res.statusCode).toBe(422);
      expect(res.json().error).toMatchObject({
        code: "outside_opening_hours",
        message: "Outside the shop's opening hours on Friday.",
      });

      const list = await admin("GET", "/barbers");
      expect(
        list.json().barbers.map((b: { name: string }) => b.name),
      ).not.toContain("Test Night Owl");
    }, withFixedClock));

  it("saves new hours and lists the bookings they no longer cover", () =>
    withApp(async (app, db) => {
      const admin = await signedIn(app, db);
      await openEveryDay(db);
      const ids = await addTuesdayBarber(db); // Tuesdays 09:00-11:00
      await book(db, ids, tuesdayAt("14:00", "14:30")); // 09:00, still covered
      await book(db, ids, tuesdayAt("15:30", "16:00")); // 10:30, not any more

      const res = await admin("PUT", `/barbers/${ids.barberId}/hours`, {
        hours: [
          { weekday: 2, startsAt: "09:00", endsAt: "10:00", break: null },
        ],
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().barber.hours).toEqual([
        { weekday: 2, startsAt: "09:00", endsAt: "10:00", break: null },
      ]);
      expect(res.json().bookingsToReview).toEqual([
        expect.objectContaining({
          date: "2026-12-01",
          label: "10:30",
          customerPhone: "+15550000",
        }),
      ]);
    }, withFixedClock));

  it("deactivates a barber, hides them from guests, and lists their bookings", () =>
    withApp(async (app, db) => {
      const admin = await signedIn(app, db);
      const ids = await addTuesdayBarber(db);
      await book(db, ids, tuesdayAt("14:00", "14:30"));

      const res = await admin("PATCH", `/barbers/${ids.barberId}`, {
        isActive: false,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().barber.isActive).toBe(false);
      expect(res.json().bookingsToReview).toHaveLength(1);

      const publicList = await app.inject({
        method: "GET",
        url: "/v1/barbers",
      });
      expect(
        publicList.json().barbers.map((b: { id: string }) => b.id),
      ).not.toContain(ids.barberId);
    }, withFixedClock));

  it("deletes a barber without bookings, refuses one with", () =>
    withApp(async (app, db) => {
      const admin = await signedIn(app, db);
      const free = await addTuesdayBarber(db);
      expect(
        (await admin("DELETE", `/barbers/${free.barberId}`)).statusCode,
      ).toBe(204);

      const busy = await addTuesdayBarber(db);
      await book(db, busy, tuesdayAt("14:00", "14:30"));
      const res = await admin("DELETE", `/barbers/${busy.barberId}`);
      expect(res.statusCode).toBe(409);
      expect(res.json().error.code).toBe("in_use");
    }, withFixedClock));
});
