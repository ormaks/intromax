import { z } from "zod";
import { booking, bookingStatus } from "./bookings";
import { id, localDate } from "./common";
import { phone } from "./phone";

/*
 * The admin's side of bookings: the table, one booking with everything the
 * guest gave, edits, and the numbers on the overview and analytics pages.
 */

/** A booking as the admin sees it: the guest view plus contact and history. */
export const adminBooking = booking.extend({
  id,
  customerPhone: z.string(),
  customerEmail: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.iso.datetime(),
  cancelledAt: z.iso.datetime().nullable(),
  completedAt: z.iso.datetime().nullable(),
});
export type AdminBooking = z.infer<typeof adminBooking>;

/** Whole days from one shop-calendar date to another. */
function daysBetween(from: string, to: string) {
  return (
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 864e5
  );
}

export const PAGE_SIZE = 25;

export const bookingListQuery = z
  .object({
    // Shop-calendar days, both included.
    from: localDate.optional(),
    to: localDate.optional(),
    status: bookingStatus.optional(),
    barberId: id.optional(),
    // Matches the customer's name, phone or the reference.
    q: z.string().trim().min(1).max(100).optional(),
    page: z.coerce.number().int().min(1).default(1),
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: "`to` can't be before `from`",
    path: ["to"],
  });
export type BookingListQuery = z.input<typeof bookingListQuery>;

/** One page of the table, newest first, with the total for paging. */
export const bookingList = z.object({
  bookings: z.array(adminBooking),
  page: z.int(),
  pageSize: z.int(),
  total: z.int(),
});
export type BookingList = z.infer<typeof bookingList>;

/**
 * An admin edit. Barber, service and time must still fit the schedule; a
 * new service re-copies its price and duration onto the booking.
 */
export const bookingPatch = z
  .object({
    name: z.string().trim().min(1).max(100),
    phone,
    email: z.email().nullable(),
    notes: z.string().trim().max(500).nullable(),
    barberId: id,
    serviceId: id,
    start: z.iso.datetime({ offset: true }),
  })
  .partial()
  .refine(
    (patch) => Object.keys(patch).length > 0,
    "Change at least one field",
  );
export type BookingPatch = z.input<typeof bookingPatch>;

const serviceRef = z.object({ id, name: z.string() });
const barberRef = z.object({ id, name: z.string() });

/** Counted bookings are the ones not cancelled; revenue is completed only. */
const tally = { bookings: z.int(), revenueCents: z.int() };

export const overview = z.object({
  today: z.object({
    date: localDate,
    ...tally,
    // Still-confirmed bookings today: money not yet earned.
    expectedCents: z.int(),
  }),
  // The next confirmed bookings from now.
  upcoming: z.array(adminBooking),
  // Most completed bookings over the last 30 days; null with none.
  topService: z
    .object({ service: serviceRef, completed: z.int(), revenueCents: z.int() })
    .nullable(),
});
export type Overview = z.infer<typeof overview>;

export const ANALYTICS_MAX_DAYS = 366;

export const analyticsQuery = z
  .object({ from: localDate, to: localDate })
  .refine((query) => query.from <= query.to, {
    message: "`to` can't be before `from`",
    path: ["to"],
  })
  .refine((query) => daysBetween(query.from, query.to) < ANALYTICS_MAX_DAYS, {
    message: `At most ${ANALYTICS_MAX_DAYS} days at a time`,
    path: ["to"],
  });
export type AnalyticsQuery = z.input<typeof analyticsQuery>;

export const analytics = z.object({
  from: localDate,
  to: localDate,
  // Every day in the range, including days with nothing booked.
  days: z.array(z.object({ date: localDate, ...tally })),
  byService: z.array(z.object({ service: serviceRef, ...tally })),
  byBarber: z.array(z.object({ barber: barberRef, ...tally })),
});
export type Analytics = z.infer<typeof analytics>;
