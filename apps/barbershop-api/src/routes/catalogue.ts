import {
  barberList,
  serviceList,
  type WorkingDay,
} from "@intromax/barbershop-contracts";
import { asc, eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { Db } from "../db/client";
import { barbers, barberWorkingHours, services } from "../db/schema";
import { toHHMM } from "../schedule/clock";

/** GET /v1/services and GET /v1/barbers: what a guest can book, and with whom. */
export const catalogueRoutes: FastifyPluginAsyncZod<{ db: Db }> = async (
  app,
  { db },
) => {
  app.get(
    "/services",
    { schema: { response: { 200: serviceList } } },
    async () => ({
      services: await db
        .select()
        .from(services)
        .where(eq(services.isActive, true))
        .orderBy(asc(services.sortOrder), asc(services.name)),
    }),
  );

  app.get(
    "/barbers",
    { schema: { response: { 200: barberList } } },
    async () => {
      const rows = await db
        .select()
        .from(barbers)
        .where(eq(barbers.isActive, true))
        .orderBy(asc(barbers.sortOrder), asc(barbers.name));

      // Every active barber's hours in one query, rather than one per barber.
      const hours = await db
        .select({ day: barberWorkingHours })
        .from(barberWorkingHours)
        .innerJoin(barbers, eq(barbers.id, barberWorkingHours.barberId))
        .where(eq(barbers.isActive, true))
        .orderBy(asc(barberWorkingHours.weekday));

      const hoursByBarber = new Map<string, WorkingDay[]>();
      for (const { day } of hours) {
        const list = hoursByBarber.get(day.barberId) ?? [];
        list.push({
          weekday: day.weekday,
          startsAt: toHHMM(day.startsAt),
          endsAt: toHHMM(day.endsAt),
          break:
            day.breakStartsAt && day.breakEndsAt
              ? {
                  startsAt: toHHMM(day.breakStartsAt),
                  endsAt: toHHMM(day.breakEndsAt),
                }
              : null,
        });
        hoursByBarber.set(day.barberId, list);
      }

      return {
        barbers: rows.map((barber) => ({
          ...barber,
          hours: hoursByBarber.get(barber.id) ?? [],
        })),
      };
    },
  );
};
