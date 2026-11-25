import { z } from "zod";
import { id, localTime, weekday } from "./common";

export const service = z.object({
  id,
  name: z.string(),
  description: z.string().nullable(),
  durationMinutes: z.int(),
  // Integer cents: 2500 is $25.00.
  priceCents: z.int(),
});
export type Service = z.infer<typeof service>;

export const serviceList = z.object({ services: z.array(service) });
export type ServiceList = z.infer<typeof serviceList>;

/** One working weekday; a weekday missing from the list is a day off. */
export const workingDay = z.object({
  weekday,
  startsAt: localTime,
  endsAt: localTime,
  break: z.object({ startsAt: localTime, endsAt: localTime }).nullable(),
});
export type WorkingDay = z.infer<typeof workingDay>;

export const barber = z.object({
  id,
  name: z.string(),
  title: z.string().nullable(),
  bio: z.string().nullable(),
  photoUrl: z.string().nullable(),
  hours: z.array(workingDay),
});
export type Barber = z.infer<typeof barber>;

export const barberList = z.object({ barbers: z.array(barber) });
export type BarberList = z.infer<typeof barberList>;
