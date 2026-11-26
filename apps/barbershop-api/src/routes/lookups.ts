import { and, eq } from "drizzle-orm";
import type { Db } from "../db/client";
import {
  barbers,
  barberWorkingHours,
  services,
  shopSettings,
} from "../db/schema";
import { NotFoundError } from "../http/errors";

/*
 * The reads several public routes share. An inactive service or barber is
 * treated as missing: a guest can't book either.
 */

export async function requireActiveService(db: Db, id: string) {
  const [service] = await db
    .select({
      id: services.id,
      name: services.name,
      durationMinutes: services.durationMinutes,
      priceCents: services.priceCents,
    })
    .from(services)
    .where(and(eq(services.id, id), eq(services.isActive, true)));
  if (!service) throw new NotFoundError("Service not found");
  return service;
}

export async function requireActiveBarber(db: Db, id: string) {
  const [barber] = await db
    .select({ id: barbers.id, name: barbers.name })
    .from(barbers)
    .where(and(eq(barbers.id, id), eq(barbers.isActive, true)));
  if (!barber) throw new NotFoundError("Barber not found");
  return barber;
}

/** The barber's hours on that weekday, or undefined on their day off. */
export async function barberHoursOn(db: Db, barberId: string, weekday: number) {
  const [hours] = await db
    .select()
    .from(barberWorkingHours)
    .where(
      and(
        eq(barberWorkingHours.barberId, barberId),
        eq(barberWorkingHours.weekday, weekday),
      ),
    );
  return hours;
}

export async function shopTimezone(db: Db) {
  const [settings] = await db
    .select({ timezone: shopSettings.timezone })
    .from(shopSettings);
  // The seed always writes this row; without it the shop isn't set up.
  if (!settings) throw new Error("shop_settings is empty; run db:seed");
  return settings.timezone;
}
