import type { WorkingDay } from "@intromax/barbershop-contracts";
import type { TimeRange } from "../db/tstzrange";
import { toMinutes } from "./clock";
import { overlaps, shopClock } from "./slots";

/**
 * Whether a booking no longer fits a barber's week: its weekday is a day off,
 * it starts before or ends after that day's hours, or it overlaps the break.
 * Read on the shop's clock, in its timezone.
 */
export function isOutsideHours(
  booking: TimeRange,
  week: WorkingDay[],
  timezone: string,
): boolean {
  const start = shopClock(booking.start, timezone);
  const end = shopClock(booking.end, timezone);
  const day = week.find((d) => d.weekday === start.weekday);
  // A booking that runs past midnight can't sit inside one working day.
  if (!day || end.date !== start.date) return true;

  if (
    start.minutes < toMinutes(day.startsAt) ||
    end.minutes > toMinutes(day.endsAt)
  ) {
    return true;
  }
  return (
    day.break !== null &&
    overlaps(
      start.minutes,
      end.minutes,
      toMinutes(day.break.startsAt),
      toMinutes(day.break.endsAt),
    )
  );
}
