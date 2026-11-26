import type { Analytics, Overview } from "@intromax/barbershop-contracts";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { barbers, bookings, services } from "../db/schema";
import { localDay, shopClock } from "../schedule/slots";
import { selectAdminBookings, startOf, toAdminBooking } from "./bookings";

/*
 * The numbers behind the overview and analytics pages. Throughout:
 * - "bookings" counts every booking that isn't cancelled;
 * - revenue counts completed bookings only, at their snapshot price;
 * - days are the shop's calendar days, so a booking at 23:30 New York time
 *   belongs to that day, not the next one in UTC.
 */

const DAY = 24 * 60 * 60 * 1000;
const UPCOMING_COUNT = 10;
const TOP_SERVICE_DAYS = 30;

const notCancelled = sql`${bookings.status} <> 'cancelled'`;
const counted = sql<number>`count(*) filter (where ${notCancelled})::int`;
const revenue = sql<number>`coalesce(sum(${bookings.priceCents}) filter (where ${bookings.status} = 'completed'), 0)::int`;

function startsIn(range: { start: Date; end: Date }) {
  return sql`${startOf} >= ${range.start.toISOString()}::timestamptz and ${startOf} < ${range.end.toISOString()}::timestamptz`;
}

export async function overview(
  db: Db,
  now: Date,
  timezone: string,
): Promise<Overview> {
  const today = shopClock(now, timezone).date;

  const [totals] = await db
    .select({
      bookings: counted,
      revenueCents: revenue,
      expectedCents: sql<number>`coalesce(sum(${bookings.priceCents}) filter (where ${bookings.status} = 'confirmed'), 0)::int`,
    })
    .from(bookings)
    .where(startsIn(localDay(today, timezone)));

  const upcoming = await selectAdminBookings(db)
    .where(
      and(
        eq(bookings.status, "confirmed"),
        sql`${startOf} >= ${now.toISOString()}::timestamptz`,
      ),
    )
    .orderBy(asc(startOf))
    .limit(UPCOMING_COUNT);

  const since = new Date(now.getTime() - TOP_SERVICE_DAYS * DAY);
  const [top] = await db
    .select({
      service: { id: services.id, name: services.name },
      completed: sql<number>`count(*)::int`,
      revenueCents: sql<number>`sum(${bookings.priceCents})::int`,
    })
    .from(bookings)
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .where(
      and(
        eq(bookings.status, "completed"),
        startsIn({ start: since, end: now }),
      ),
    )
    .groupBy(services.id, services.name)
    .orderBy(desc(sql`count(*)`), desc(sql`sum(${bookings.priceCents})`))
    .limit(1);

  return {
    today: {
      date: today,
      bookings: totals?.bookings ?? 0,
      revenueCents: totals?.revenueCents ?? 0,
      expectedCents: totals?.expectedCents ?? 0,
    },
    upcoming: upcoming.map((row) => toAdminBooking(row, timezone)),
    topService: top ?? null,
  };
}

/** Every date from `from` to `to`, both included. */
function datesBetween(from: string, to: string) {
  const dates: string[] = [];
  for (
    let t = Date.parse(`${from}T00:00:00Z`);
    t <= Date.parse(`${to}T00:00:00Z`);
    t += DAY
  ) {
    dates.push(new Date(t).toISOString().slice(0, 10));
  }
  return dates;
}

export async function analytics(
  db: Db,
  { from, to }: { from: string; to: string },
  timezone: string,
): Promise<Analytics> {
  const range = startsIn({
    start: localDay(from, timezone).start,
    end: localDay(to, timezone).end,
  });
  // The shop-calendar day a booking starts on, as YYYY-MM-DD text.
  const day = sql<string>`to_char(${startOf} at time zone ${timezone}, 'YYYY-MM-DD')`;

  const perDay = await db
    .select({ date: day, bookings: counted, revenueCents: revenue })
    .from(bookings)
    .where(range)
    // By position: the timezone is a query parameter, so writing the
    // expression again would be a different parameter, which Postgres can't
    // match to the selected column.
    .groupBy(sql`1`);
  const byDate = new Map(perDay.map((row) => [row.date, row]));

  const byService = await db
    .select({
      service: { id: services.id, name: services.name },
      bookings: counted,
      revenueCents: revenue,
    })
    .from(bookings)
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .where(and(range, notCancelled))
    .groupBy(services.id, services.name)
    .orderBy(desc(sql`count(*)`), asc(services.name));

  const byBarber = await db
    .select({
      barber: { id: barbers.id, name: barbers.name },
      bookings: counted,
      revenueCents: revenue,
    })
    .from(bookings)
    .innerJoin(barbers, eq(barbers.id, bookings.barberId))
    .where(and(range, notCancelled))
    .groupBy(barbers.id, barbers.name)
    .orderBy(desc(sql`count(*)`), asc(barbers.name));

  return {
    from,
    to,
    days: datesBetween(from, to).map((date) => ({
      date,
      bookings: byDate.get(date)?.bookings ?? 0,
      revenueCents: byDate.get(date)?.revenueCents ?? 0,
    })),
    byService,
    byBarber,
  };
}
