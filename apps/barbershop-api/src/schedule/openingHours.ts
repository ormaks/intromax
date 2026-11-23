/** A barber's working day. Times are local `HH:MM` or `HH:MM:SS`. */
export type WorkingDay = { weekday: number; startsAt: string; endsAt: string };

/** The shop's opening hours for one weekday. No entry means closed. */
export type OpeningDay = { weekday: number; opensAt: string; closesAt: string };

/** Minutes since midnight; accepts both `09:00` and `09:00:00`. */
function toMinutes(time: string): number {
  const [hours = NaN, minutes = NaN] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    throw new Error(`Expected HH:MM, got: ${time}`);
  }
  return hours * 60 + minutes;
}

/**
 * The weekdays on which a barber's working day isn't fully inside the shop's
 * opening hours, including days the shop is closed. Empty means every day fits.
 */
export function weekdaysOutsideOpeningHours(
  workingDays: WorkingDay[],
  openingDays: OpeningDay[],
): number[] {
  return workingDays
    .filter((day) => {
      const opening = openingDays.find((o) => o.weekday === day.weekday);
      return (
        !opening ||
        toMinutes(day.startsAt) < toMinutes(opening.opensAt) ||
        toMinutes(day.endsAt) > toMinutes(opening.closesAt)
      );
    })
    .map((day) => day.weekday);
}
