import { TZDate } from "@date-fns/tz";
import type { TimeRange } from "../db/tstzrange";
import { formatMinutes, toMinutes } from "./clock";

/** Bookable start times sit on a grid of this many minutes: :00 :15 :30 :45. */
export const SLOT_STEP_MINUTES = 15;
/** How far ahead a guest can book. */
export const BOOKING_HORIZON_DAYS = 60;
/** How soon before its start a slot can still be booked. */
export const MIN_LEAD_MINUTES = 60;
/** How soon before its start a guest can still cancel online. */
export const GUEST_CANCEL_CUTOFF_MINUTES = 120;

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;

/** One barber's hours on one day, on the shop's clock. */
export type DayHours = {
  startsAt: string;
  endsAt: string;
  breakStartsAt: string | null;
  breakEndsAt: string | null;
};

export type FreeSlot = {
  /** The exact instant the slot starts. */
  start: Date;
  /** The same start on the shop's clock, e.g. "10:15". */
  label: string;
};

/**
 * The free start times for one barber, one service and one day, earliest
 * first. A start is free when the whole service fits inside the barber's
 * hours, misses their break and every existing booking, and falls inside the
 * booking window (at least MIN_LEAD_MINUTES from now, at most
 * BOOKING_HORIZON_DAYS ahead).
 *
 * The result is a hint, not a promise: two guests can see the same free slot,
 * and the database's overlap constraint decides who gets it.
 */
export function freeSlots({
  date,
  timezone,
  hours,
  durationMinutes,
  bookings,
  now,
}: {
  /** A day on the shop's calendar, "YYYY-MM-DD". */
  date: string;
  /** The shop's IANA timezone, e.g. "America/New_York". */
  timezone: string;
  hours: DayHours;
  durationMinutes: number;
  /** The barber's non-cancelled bookings around that day. */
  bookings: TimeRange[];
  now: Date;
}): FreeSlot[] {
  const [year = NaN, month = NaN, day = NaN] = date.split("-").map(Number);

  const earliest = now.getTime() + MIN_LEAD_MINUTES * MINUTE;
  const latest = now.getTime() + BOOKING_HORIZON_DAYS * DAY;

  const open = roundUp(toMinutes(hours.startsAt), SLOT_STEP_MINUTES);
  const close = toMinutes(hours.endsAt);
  const breakStart = hours.breakStartsAt
    ? toMinutes(hours.breakStartsAt)
    : null;
  const breakEnd = hours.breakEndsAt ? toMinutes(hours.breakEndsAt) : null;

  const slots: FreeSlot[] = [];
  for (
    let start = open;
    start + durationMinutes <= close;
    start += SLOT_STEP_MINUTES
  ) {
    const end = start + durationMinutes;
    if (
      breakStart !== null &&
      breakEnd !== null &&
      overlaps(start, end, breakStart, breakEnd)
    ) {
      continue;
    }

    const startsAt = new TZDate(
      year,
      month - 1,
      day,
      Math.floor(start / 60),
      start % 60,
      timezone,
    );
    // When the clocks spring forward, times like 02:15 don't exist and
    // TZDate moves them to 03:15. Skip them rather than offer a slot whose
    // label doesn't match its instant. (When the clocks fall back, a repeated
    // time like 01:30 means its first occurrence.)
    if (startsAt.getHours() * 60 + startsAt.getMinutes() !== start) continue;
    const startMs = startsAt.getTime();
    const endMs = startMs + durationMinutes * MINUTE;

    if (startMs < earliest || startMs > latest) continue;
    if (
      bookings.some((booking) =>
        overlaps(
          startMs,
          endMs,
          booking.start.getTime(),
          booking.end.getTime(),
        ),
      )
    ) {
      continue;
    }

    slots.push({ start: new Date(startMs), label: formatMinutes(start) });
  }
  return slots;
}

/**
 * A day on the shop's calendar as instants: from its midnight to the next.
 * Usually 24 hours long, but 23 or 25 on the days the clocks change.
 */
export function localDay(date: string, timezone: string): TimeRange {
  const [year = NaN, month = NaN, day = NaN] = date.split("-").map(Number);
  return {
    start: new Date(new TZDate(year, month - 1, day, timezone).getTime()),
    end: new Date(new TZDate(year, month - 1, day + 1, timezone).getTime()),
  };
}

/** Whether half-open intervals [aStart, aEnd) and [bStart, bEnd) share any time. */
function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

function roundUp(value: number, step: number) {
  return Math.ceil(value / step) * step;
}
