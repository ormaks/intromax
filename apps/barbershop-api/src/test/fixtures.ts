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
