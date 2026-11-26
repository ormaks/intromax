import {
  availability,
  availabilityQuery,
} from "@intromax/barbershop-contracts";
import { and, eq, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { Db } from "../db/client";
import {
  barbers,
  barberWorkingHours,
  bookings,
  services,
  shopSettings,
} from "../db/schema";
import { NotFoundError } from "../http/errors";
import { freeSlots, localDay } from "../schedule/slots";

/**
 * GET /v1/availability?serviceId&barberId&date: the free start times for one
 * service with one barber on one day of the shop's calendar.
 */
export const availabilityRoutes: FastifyPluginAsyncZod<{
  db: Db;
  now: () => Date;
}> = async (app, { db, now }) => {
  app.get(
    "/availability",
    {
      schema: {
        querystring: availabilityQuery,
        response: { 200: availability },
      },
    },
    async (request) => {
      const { serviceId, barberId, date } = request.query;

      const [service] = await db
        .select({ durationMinutes: services.durationMinutes })
        .from(services)
        .where(and(eq(services.id, serviceId), eq(services.isActive, true)));
      if (!service) throw new NotFoundError("Service not found");

      const [barber] = await db
        .select({ id: barbers.id })
        .from(barbers)
        .where(and(eq(barbers.id, barberId), eq(barbers.isActive, true)));
      if (!barber) throw new NotFoundError("Barber not found");

      // A calendar date's weekday is the same in every timezone, so reading
      // it in UTC is safe.
      const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
      const [hours] = await db
        .select()
        .from(barberWorkingHours)
        .where(
          and(
            eq(barberWorkingHours.barberId, barberId),
            eq(barberWorkingHours.weekday, weekday),
          ),
        );
      if (!hours) return { slots: [] };

      const [settings] = await db
        .select({ timezone: shopSettings.timezone })
        .from(shopSettings);
      if (!settings) throw new Error("shop_settings is empty; run db:seed");

      // Every live booking that touches the day, including one that started
      // the evening before. The conditions match the overlap constraint's
      // GiST index (barber_id, during, status <> 'cancelled'), so Postgres
      // can answer from the index. 'cancelled' is written as a literal, not a
      // parameter, so the planner can see it matches the index's condition.
      const day = localDay(date, settings.timezone);
      const taken = await db
        .select({ during: bookings.during })
        .from(bookings)
        .where(
          and(
            eq(bookings.barberId, barberId),
            sql`${bookings.status} <> 'cancelled'`,
            sql`${bookings.during} && tstzrange(${day.start.toISOString()}::timestamptz, ${day.end.toISOString()}::timestamptz)`,
          ),
        );

      const slots = freeSlots({
        date,
        timezone: settings.timezone,
        hours,
        durationMinutes: service.durationMinutes,
        bookings: taken.map((row) => row.during),
        now: now(),
      });

      return {
        slots: slots.map((slot) => ({
          start: slot.start.toISOString(),
          label: slot.label,
        })),
      };
    },
  );
};
