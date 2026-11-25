/*
 * Wall-clock times on the shop's clock, as Postgres `time` returns them
 * ("09:00:00") and as the API sends them ("09:00").
 */

/** Minutes since midnight; accepts both `09:00` and `09:00:00`. */
export function toMinutes(time: string): number {
  const [hours = NaN, minutes = NaN] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    throw new Error(`Expected HH:MM, got: ${time}`);
  }
  return hours * 60 + minutes;
}

/** Minutes since midnight as `HH:MM`: 615 -> "10:15". */
export function formatMinutes(minutes: number): string {
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** A Postgres `time` as `HH:MM`: "09:00:00" -> "09:00". */
export function toHHMM(time: string): string {
  return formatMinutes(toMinutes(time));
}
