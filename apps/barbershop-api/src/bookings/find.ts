import { and, eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { barbers, bookings, services } from "../db/schema";
import { NotFoundError } from "../http/errors";
import type { BookingRecord } from "./view";

/**
 * The booking with this reference and phone, both already normalised.
 * A wrong phone answers exactly like an unknown reference, so the API never
 * confirms that a reference exists to someone who doesn't know the phone.
 */
export async function findGuestBooking(
  db: Db,
  { reference, phone }: { reference: string; phone: string },
): Promise<BookingRecord & { id: string }> {
  const [row] = await db
    .select({
      id: bookings.id,
      reference: bookings.reference,
      status: bookings.status,
      during: bookings.during,
      priceCents: bookings.priceCents,
      durationMinutes: bookings.durationMinutes,
      customerName: bookings.customerName,
      service: { id: services.id, name: services.name },
      barber: { id: barbers.id, name: barbers.name },
    })
    .from(bookings)
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(barbers, eq(barbers.id, bookings.barberId))
    .where(
      and(eq(bookings.reference, reference), eq(bookings.customerPhone, phone)),
    );
  if (!row) {
    throw new NotFoundError(
      "No booking matches that reference and phone number",
    );
  }
  return row;
}
