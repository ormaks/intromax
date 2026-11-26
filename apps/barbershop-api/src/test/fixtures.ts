import type { Db } from "../db/client";
import * as schema from "../db/schema";
import type { TimeRange } from "../db/tstzrange";

let referenceCounter = 0;

/** An active barber and a 30-minute service. */
export async function addBarberAndService(db: Db) {
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

// 2026-12-01 is a Tuesday; New York is UTC-5 then, so 09:00 local is 14:00Z.
export const TUESDAY = "2026-12-01";
/** A fixed "now" the day before TUESDAY. */
export const NOW = new Date("2026-11-30T12:00:00Z");

/**
 * A New York shop and a barber who works Tuesdays 09:00-11:00, with a
 * 30-minute $25 service.
 */
export async function addTuesdayBarber(db: Db) {
  await db
    .insert(schema.shopSettings)
    .values({
      name: "Test Shop",
      timezone: "America/New_York",
      phone: "+15550000",
      email: "shop@example.com",
      address: "1 Test St",
    })
    .onConflictDoUpdate({
      target: schema.shopSettings.id,
      set: { timezone: "America/New_York" },
    });
  const ids = await addBarberAndService(db);
  await db.insert(schema.barberWorkingHours).values({
    barberId: ids.barberId,
    weekday: 2,
    startsAt: "09:00",
    endsAt: "11:00",
  });
  return ids;
}

/**
 * An admin user. The password hash is a placeholder: tests that log in hash
 * a real password themselves.
 */
export async function addAdmin(db: Db, passwordHash = "unused") {
  const [user] = await db
    .insert(schema.users)
    .values({
      email: `admin-${++referenceCounter}@example.com`,
      name: "Test Admin",
      role: "admin",
      passwordHash,
    })
    .returning();
  if (!user) throw new Error("Fixture insert returned nothing");
  return user;
}

/** Replaces the shop's opening hours: every weekday 08:00-19:00. */
export async function openEveryDay(db: Db) {
  await db.delete(schema.openingHours);
  await db.insert(schema.openingHours).values(
    [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      opensAt: "08:00",
      closesAt: "19:00",
    })),
  );
}

/** A confirmed guest booking. Await it, or chain `.returning()` first. */
export function book(
  db: Db,
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
