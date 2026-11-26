import type { Barber, Service } from "@intromax/barbershop-contracts";
import { describe, expect, it } from "vitest";
import { barbers, barberWorkingHours, services } from "../db/schema";
import { withApp } from "../test/app";

describe("GET /v1/services", () => {
  it("lists active services with only the contract's fields", () =>
    withApp(async (app, db) => {
      await db.insert(services).values([
        { name: "Test Active Cut", durationMinutes: 30, priceCents: 2500 },
        {
          name: "Test Retired Cut",
          durationMinutes: 30,
          priceCents: 2500,
          isActive: false,
        },
      ]);

      const res = await app.inject({ method: "GET", url: "/v1/services" });
      expect(res.statusCode).toBe(200);
      const list: Service[] = res.json().services;
      const names = list.map((service) => service.name);
      expect(names).toContain("Test Active Cut");
      expect(names).not.toContain("Test Retired Cut");

      const active = list.find((service) => service.name === "Test Active Cut");
      expect(Object.keys(active ?? {}).sort()).toEqual([
        "description",
        "durationMinutes",
        "id",
        "name",
        "priceCents",
      ]);
    }));
});

describe("GET /v1/barbers", () => {
  it("lists active barbers with their hours as HH:MM", () =>
    withApp(async (app, db) => {
      const [barber] = await db
        .insert(barbers)
        .values({ name: "Test Barber" })
        .returning();
      await db.insert(barbers).values({ name: "Test Gone", isActive: false });
      if (!barber) throw new Error("Fixture insert returned nothing");
      await db.insert(barberWorkingHours).values([
        {
          barberId: barber.id,
          weekday: 1,
          startsAt: "09:00",
          endsAt: "18:00",
          breakStartsAt: "13:00",
          breakEndsAt: "14:00",
        },
        { barberId: barber.id, weekday: 2, startsAt: "10:00", endsAt: "16:00" },
      ]);

      const res = await app.inject({ method: "GET", url: "/v1/barbers" });
      expect(res.statusCode).toBe(200);
      const list: Barber[] = res.json().barbers;
      expect(list.map((b) => b.name)).not.toContain("Test Gone");
      expect(list.find((b) => b.id === barber.id)?.hours).toEqual([
        {
          weekday: 1,
          startsAt: "09:00",
          endsAt: "18:00",
          break: { startsAt: "13:00", endsAt: "14:00" },
        },
        { weekday: 2, startsAt: "10:00", endsAt: "16:00", break: null },
      ]);
    }));
});
