import { z } from "zod";
import { id, localDate, localTime } from "./common";
import { phone } from "./phone";

/**
 * A booking reference as a guest might type it ("k7m2 9qxa", "K7M29QXA"),
 * normalised to "K7M2-9QXA". References use Crockford's base32, which leaves
 * out I, L, O and U; the look-alikes I/L and O are read as 1 and 0, as that
 * alphabet specifies, so a misread code still matches.
 */
export const reference = z
  .string()
  .transform((raw) =>
    raw
      .toUpperCase()
      .replace(/[\s-]/g, "")
      .replace(/[IL]/g, "1")
      .replace(/O/g, "0"),
  )
  .pipe(
    z
      .string()
      .regex(/^[0-9A-HJKMNP-TV-Z]{8}$/, "Expected a reference like K7M2-9QXA"),
  )
  .transform((code) => `${code.slice(0, 4)}-${code.slice(4)}`);

export const createBookingRequest = z.object({
  serviceId: id,
  barberId: id,
  // A slot's `start` from GET /v1/availability, sent back unchanged.
  start: z.iso.datetime({ offset: true }),
  name: z.string().trim().min(1).max(100),
  phone,
  email: z.email().optional(),
  notes: z.string().trim().max(500).optional(),
});
export type CreateBookingRequest = z.input<typeof createBookingRequest>;

/** What a guest proves they know to see or cancel a booking. */
export const bookingAccess = z.object({ reference, phone });
export type BookingAccess = z.input<typeof bookingAccess>;

export const bookingStatus = z.enum(["confirmed", "completed", "cancelled"]);
export type BookingStatus = z.infer<typeof bookingStatus>;

/** A booking as the guest sees it. The phone is never sent back. */
export const booking = z.object({
  reference: z.string(),
  status: bookingStatus,
  start: z.iso.datetime(),
  end: z.iso.datetime(),
  // The start on the shop's calendar and clock, for display.
  date: localDate,
  label: localTime,
  service: z.object({ id, name: z.string() }),
  barber: z.object({ id, name: z.string() }),
  // Snapshots from the moment of booking.
  priceCents: z.int(),
  durationMinutes: z.int(),
  customerName: z.string(),
});
export type Booking = z.infer<typeof booking>;
