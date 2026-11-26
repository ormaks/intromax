import {
  availability,
  availabilityQuery,
} from "@intromax/barbershop-contracts";
import { and, eq, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { Db } from "../db/client";
import { bookings } from "../db/schema";
import { freeSlots, localDay } from "../schedule/slots";
import {
  barberHoursOn,
  requireActiveBarber,
  requireActiveService,
  shopTimezone,
} from "./lookups";

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

      const service = await requireActiveService(db, serviceId);
      await requireActiveBarber(db, barberId);

      // A calendar date's weekday is the same in every timezone, so reading
      // it in UTC is safe.
      const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
      const hours = await barberHoursOn(db, barberId, weekday);
      if (!hours) return { slots: [] };

      const timezone = await shopTimezone(db);

      // Every live booking that touches the day, including one that started
      // the evening before. The conditions match the overlap constraint's
      // GiST index (barber_id, during, status <> 'cancelled'), so Postgres
      // can answer from the index. 'cancelled' is written as a literal, not a
      // parameter, so the planner can see it matches the index's condition.
      const day = localDay(date, timezone);
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
        timezone,
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
