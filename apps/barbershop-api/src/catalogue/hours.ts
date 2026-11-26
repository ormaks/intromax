import type { WorkingDay } from "@intromax/barbershop-contracts";
import type { barberWorkingHours } from "../db/schema";
import { toHHMM } from "../schedule/clock";

type HoursRow = typeof barberWorkingHours.$inferSelect;

/** A stored working day in the API's shape: HH:MM times, a nested break. */
export function toWorkingDay(row: HoursRow): WorkingDay {
  return {
    weekday: row.weekday,
    startsAt: toHHMM(row.startsAt),
    endsAt: toHHMM(row.endsAt),
    break:
      row.breakStartsAt && row.breakEndsAt
        ? {
            startsAt: toHHMM(row.breakStartsAt),
            endsAt: toHHMM(row.breakEndsAt),
          }
        : null,
  };
}

/** Rows from one query over many barbers, grouped by barber. */
export function groupHoursByBarber(rows: HoursRow[]) {
  const byBarber = new Map<string, WorkingDay[]>();
  for (const row of rows) {
    byBarber.set(row.barberId, [
      ...(byBarber.get(row.barberId) ?? []),
      toWorkingDay(row),
    ]);
  }
  return byBarber;
}
