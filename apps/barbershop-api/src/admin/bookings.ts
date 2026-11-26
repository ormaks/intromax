import {
  type AdminBooking,
  type BookingListQuery,
  PAGE_SIZE,
} from "@intromax/barbershop-contracts";
import { and, count, desc, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import { bookingView } from "../bookings/view";
import type { Db } from "../db/client";
import { barbers, bookings, services } from "../db/schema";
import { localDay } from "../schedule/slots";

/** The columns an admin booking is built from, joined with its names. */
export const adminBookingColumns = {
  id: bookings.id,
  reference: bookings.reference,
  status: bookings.status,
  during: bookings.during,
  priceCents: bookings.priceCents,
  durationMinutes: bookings.durationMinutes,
  customerName: bookings.customerName,
  customerPhone: bookings.customerPhone,
  customerEmail: bookings.customerEmail,
  notes: bookings.notes,
  createdAt: bookings.createdAt,
  cancelledAt: bookings.cancelledAt,
  completedAt: bookings.completedAt,
  service: { id: services.id, name: services.name },
  barber: { id: barbers.id, name: barbers.name },
};

/** Selects admin bookings: callers add where, order and paging. */
export function selectAdminBookings(db: Db) {
  return db
    .select(adminBookingColumns)
    .from(bookings)
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(barbers, eq(barbers.id, bookings.barberId));
}

/** One row of `selectAdminBookings`, typed from the query itself. */
type AdminBookingRow = Awaited<ReturnType<typeof selectAdminBookings>>[number];

export function toAdminBooking(
  row: AdminBookingRow,
  timezone: string,
): AdminBooking {
  return {
    ...bookingView(row, timezone),
    id: row.id,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

/** `lower(during)`: the booking's start, for ranges and ordering. */
export const startOf = sql`lower(${bookings.during})`;

/** Escapes LIKE's wildcards, so a search for "50%" means those characters. */
function likeText(text: string) {
  return `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/** The table's filters as SQL conditions. */
function listConditions(
  query: Omit<BookingListQuery, "page">,
  timezone: string,
): SQL | undefined {
  const conditions: SQL[] = [];
  if (query.from) {
    const day = localDay(query.from, timezone);
    conditions.push(sql`${startOf} >= ${day.start.toISOString()}::timestamptz`);
  }
  if (query.to) {
    const day = localDay(query.to, timezone);
    conditions.push(sql`${startOf} < ${day.end.toISOString()}::timestamptz`);
  }
  if (query.status) conditions.push(eq(bookings.status, query.status));
  if (query.barberId) conditions.push(eq(bookings.barberId, query.barberId));
  if (query.q) {
    const matches = [
      ilike(bookings.customerName, likeText(query.q)),
      ilike(bookings.reference, likeText(query.q)),
    ];
    // Phones are stored as digits (and a leading +), so search by digits.
    const digits = query.q.replace(/\D/g, "");
    if (digits.length >= 3) {
      matches.push(ilike(bookings.customerPhone, likeText(digits)));
    }
    const match = or(...matches);
    if (match) conditions.push(match);
  }
  return conditions.length > 0 ? and(...conditions) : undefined;
}

/** One page of the bookings table, newest start first, and the total. */
export async function listBookings(
  db: Db,
  query: BookingListQuery & { page: number },
  timezone: string,
) {
  const where = listConditions(query, timezone);
  const rows = await selectAdminBookings(db)
    .where(where)
    // The id last: a unique tie-breaker keeps paging stable when two
    // bookings share a start and a creation time.
    .orderBy(desc(startOf), desc(bookings.createdAt), desc(bookings.id))
    .limit(PAGE_SIZE)
    .offset((query.page - 1) * PAGE_SIZE);
  const [totals] = await db
    .select({ total: count() })
    .from(bookings)
    .where(where);
  return {
    bookings: rows.map((row) => toAdminBooking(row, timezone)),
    page: query.page,
    pageSize: PAGE_SIZE,
    total: totals?.total ?? 0,
  };
}

export async function findAdminBookingRow(db: Db, id: string) {
  const [row] = await selectAdminBookings(db).where(eq(bookings.id, id));
  return row;
}
