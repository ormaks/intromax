import { z } from "zod";
import { localTime, weekday } from "./common";

/** One open weekday; a weekday missing from the list is closed. */
export const openingDay = z.object({
  weekday,
  opensAt: localTime,
  closesAt: localTime,
});
export type OpeningDay = z.infer<typeof openingDay>;

export const shop = z.object({
  name: z.string(),
  // IANA name, e.g. "America/New_York". Every local date and time in the API
  // is read in this zone.
  timezone: z.string(),
  phone: z.string(),
  email: z.string(),
  address: z.string(),
  openingHours: z.array(openingDay),
});
export type Shop = z.infer<typeof shop>;
