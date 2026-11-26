import { z } from "zod";
import { id, localDate, localTime } from "./common";

export const availabilityQuery = z.object({
  serviceId: id,
  barberId: id,
  date: localDate,
});
export type AvailabilityQuery = z.infer<typeof availabilityQuery>;

export const slot = z.object({
  // The exact instant, e.g. "2026-12-01T15:15:00.000Z". Sent back unchanged
  // when booking.
  start: z.iso.datetime(),
  // The same start on the shop's clock, for display, e.g. "10:15".
  label: localTime,
});
export type Slot = z.infer<typeof slot>;

/** Free start times, earliest first. */
export const availability = z.object({ slots: z.array(slot) });
export type Availability = z.infer<typeof availability>;
