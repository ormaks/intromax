import { customType } from "drizzle-orm/pg-core";

/** A half-open time range: `start` is included, `end` is not. */
export type TimeRange = { start: Date; end: Date };

/**
 * Postgres prints a timestamptz like `2026-03-03 14:00:00+00` or
 * `2026-03-03 14:00:00.5+05:30`. That isn't ISO 8601, so it's rewritten
 * before `new Date()` reads it: a `T` between date and time, and a minutes
 * part on an hours-only offset.
 */
function parseTimestamptz(text: string): Date {
  const iso = text.replace(" ", "T").replace(/([+-]\d{2})$/, "$1:00");
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Unreadable timestamptz: ${text}`);
  }
  return date;
}

/**
 * Reads a range as Postgres prints it, e.g.
 * `["2026-03-03 14:00:00+00","2026-03-03 14:30:00+00")`.
 * Only finite `[start, end)` ranges are accepted, which is the only shape
 * the bookings table allows.
 */
export function parseTimeRange(text: string): TimeRange {
  const match = /^\["?([^",]+)"?,"?([^",]+)"?\)$/.exec(text);
  if (!match?.[1] || !match[2]) {
    throw new Error(`Expected a finite [start,end) range, got: ${text}`);
  }
  return { start: parseTimestamptz(match[1]), end: parseTimestamptz(match[2]) };
}

export function formatTimeRange({ start, end }: TimeRange): string {
  return `[${start.toISOString()},${end.toISOString()})`;
}

/**
 * A `tstzrange` column. Drizzle has no built-in range type, so this tells it
 * the SQL type name and how to convert to and from `{ start, end }`.
 */
export const tstzrange = customType<{ data: TimeRange; driverData: string }>({
  dataType: () => "tstzrange",
  toDriver: formatTimeRange,
  fromDriver: parseTimeRange,
});
