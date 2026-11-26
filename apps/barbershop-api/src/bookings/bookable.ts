import type { Db } from "../db/client";
import { HttpError } from "../http/errors";
import { barberHoursOn } from "../routes/lookups";
import { freeSlots, shopClock } from "../schedule/slots";

/**
 * Throws 422 `slot_unavailable` unless `start` is one availability would
 * offer: on the grid, inside the barber's hours, clear of the break, inside
 * the booking window. Guest bookings and admin edits share it, so the two
 * can't drift apart; admin edits pass a lead time of 0.
 *
 * Other bookings are left out on purpose: the database's overlap constraint
 * checks them, race-free, when the row is written.
 */
export async function assertBookable(
  db: Db,
  {
    barberId,
    durationMinutes,
    start,
    timezone,
    now,
    leadMinutes,
  }: {
    barberId: string;
    durationMinutes: number;
    start: Date;
    timezone: string;
    now: Date;
    leadMinutes?: number;
  },
) {
  const local = shopClock(start, timezone);
  const hours = await barberHoursOn(db, barberId, local.weekday);
  const offered = hours
    ? freeSlots({
        date: local.date,
        timezone,
        hours,
        durationMinutes,
        bookings: [],
        now,
        leadMinutes,
      })
    : [];
  if (!offered.some((slot) => slot.start.getTime() === start.getTime())) {
    throw new HttpError(
      422,
      "slot_unavailable",
      "That time can't be booked. Pick one of the offered times.",
    );
  }
}
