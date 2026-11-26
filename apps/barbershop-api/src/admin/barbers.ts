import type {
  AdminBarber,
  BookingToReview,
  WorkingDay,
} from "@intromax/barbershop-contracts";
import { and, asc, eq, sql } from "drizzle-orm";
import { groupHoursByBarber } from "../catalogue/hours";
import type { Db } from "../db/client";
import {
  barbers,
  barberWorkingHours,
  bookings,
  openingHours,
  services,
} from "../db/schema";
import type { TimeRange } from "../db/tstzrange";
import { HttpError } from "../http/errors";
import { formatMinutes } from "../schedule/clock";
import { weekdaysOutsideOpeningHours } from "../schedule/openingHours";
import { shopClock } from "../schedule/slots";

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Replaces a barber's whole week. Every day must sit inside the shop's
 * opening hours for that weekday (422 `outside_opening_hours` otherwise).
 * Run it inside a transaction, so a failure leaves the old week in place.
 */
export async function replaceWeekHours(
  db: Db,
  barberId: string,
  week: WorkingDay[],
) {
  const opening = await db.select().from(openingHours);
  const outside = weekdaysOutsideOpeningHours(week, opening);
  if (outside.length > 0) {
    const days = outside.map((weekday) => WEEKDAY_NAMES[weekday]).join(", ");
    throw new HttpError(
      422,
      "outside_opening_hours",
      `Outside the shop's opening hours on ${days}.`,
    );
  }

  await db
    .delete(barberWorkingHours)
    .where(eq(barberWorkingHours.barberId, barberId));
  if (week.length > 0) {
    await db.insert(barberWorkingHours).values(
      week.map((day) => ({
        barberId,
        weekday: day.weekday,
        startsAt: day.startsAt,
        endsAt: day.endsAt,
        breakStartsAt: day.break?.startsAt ?? null,
        breakEndsAt: day.break?.endsAt ?? null,
      })),
    );
  }
}

/** One barber with their hours, inactive ones included; undefined if none. */
export async function findAdminBarber(
  db: Db,
  id: string,
): Promise<AdminBarber | undefined> {
  const [barber] = await db.select().from(barbers).where(eq(barbers.id, id));
  if (!barber) return undefined;
  const hours = await db
    .select()
    .from(barberWorkingHours)
    .where(eq(barberWorkingHours.barberId, id))
    .orderBy(asc(barberWorkingHours.weekday));
  return { ...barber, hours: groupHoursByBarber(hours).get(id) ?? [] };
}

/** Every barber with their hours, inactive ones included. */
export async function listAdminBarbers(db: Db): Promise<AdminBarber[]> {
  const rows = await db
    .select()
    .from(barbers)
    .orderBy(asc(barbers.sortOrder), asc(barbers.name));
  const hours = await db
    .select()
    .from(barberWorkingHours)
    .orderBy(asc(barberWorkingHours.weekday));
  const byBarber = groupHoursByBarber(hours);
  return rows.map((barber) => ({
    ...barber,
    hours: byBarber.get(barber.id) ?? [],
  }));
}

/** The barber's confirmed bookings that haven't started yet, earliest first. */
export async function upcomingBookings(db: Db, barberId: string, now: Date) {
  return db
    .select({
      reference: bookings.reference,
      during: bookings.during,
      customerName: bookings.customerName,
      customerPhone: bookings.customerPhone,
      service: { id: services.id, name: services.name },
    })
    .from(bookings)
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .where(
      and(
        eq(bookings.barberId, barberId),
        eq(bookings.status, "confirmed"),
        sql`lower(${bookings.during}) > ${now.toISOString()}::timestamptz`,
      ),
    )
    .orderBy(sql`lower(${bookings.during})`);
}

export function toReview(
  booking: {
    reference: string;
    during: TimeRange;
    customerName: string;
    customerPhone: string;
    service: { id: string; name: string };
  },
  timezone: string,
): BookingToReview {
  const local = shopClock(booking.during.start, timezone);
  return {
    reference: booking.reference,
    start: booking.during.start.toISOString(),
    date: local.date,
    label: formatMinutes(local.minutes),
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    service: booking.service,
  };
}
