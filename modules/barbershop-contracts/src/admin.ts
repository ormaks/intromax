import { z } from "zod";
import { barber, service, workingDay } from "./catalogue";
import { id, localDate, localTime } from "./common";

/** Display order: small numbers, well inside Postgres's integer range. */
const sortOrder = z.int().min(0).max(10_000);

/*
 * The admin's view of the catalogue: everything the public views have, plus
 * what only the admin manages (inactive rows, display order).
 */

export const adminService = service.extend({
  isActive: z.boolean(),
  sortOrder: z.int(),
});
export type AdminService = z.infer<typeof adminService>;

export const adminServiceList = z.object({ services: z.array(adminService) });

const serviceFields = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).nullable(),
  durationMinutes: z.int().min(5).max(480),
  // Up to $10,000; also keeps the value inside Postgres's integer range.
  priceCents: z.int().min(0).max(1_000_000),
  isActive: z.boolean(),
  sortOrder,
});

export const serviceCreate = serviceFields.partial({
  description: true,
  isActive: true,
  sortOrder: true,
});
export type ServiceCreate = z.input<typeof serviceCreate>;

export const servicePatch = serviceFields
  .partial()
  .refine(
    (patch) => Object.keys(patch).length > 0,
    "Change at least one field",
  );
export type ServicePatch = z.input<typeof servicePatch>;

/**
 * One working day as the admin sends it. Mirrors the database's checks, so a
 * mistake comes back as a 422 naming the field rather than a failed insert.
 * HH:MM strings compare correctly as text.
 */
export const workingDayInput = workingDay
  .refine((day) => day.startsAt < day.endsAt, {
    message: "The day must start before it ends",
    path: ["endsAt"],
  })
  .refine(
    (day) =>
      !day.break ||
      (day.startsAt < day.break.startsAt &&
        day.break.startsAt < day.break.endsAt &&
        day.break.endsAt < day.endsAt),
    { message: "The break must sit inside the working hours", path: ["break"] },
  );

/** A whole week: each weekday at most once; a missing weekday is a day off. */
export const weekHours = z
  .array(workingDayInput)
  .max(7)
  .refine(
    (days) => new Set(days.map((day) => day.weekday)).size === days.length,
    "Each weekday can appear only once",
  );
export type WeekHours = z.input<typeof weekHours>;

export const weekHoursPut = z.object({ hours: weekHours });

export const adminBarber = barber.extend({
  isActive: z.boolean(),
  sortOrder: z.int(),
});
export type AdminBarber = z.infer<typeof adminBarber>;

export const adminBarberList = z.object({ barbers: z.array(adminBarber) });

const barberFields = z.object({
  name: z.string().trim().min(1).max(100),
  title: z.string().trim().max(100).nullable(),
  bio: z.string().trim().max(1000).nullable(),
  // http(s) only: the frontend shows it as an image, and a javascript: or
  // data: URL there would run or embed whatever the value says.
  photoUrl: z.url({ protocol: /^https?$/ }).nullable(),
  isActive: z.boolean(),
  sortOrder,
});

export const barberCreate = barberFields
  .partial({
    title: true,
    bio: true,
    photoUrl: true,
    isActive: true,
    sortOrder: true,
  })
  .extend({ hours: weekHours.optional() });
export type BarberCreate = z.input<typeof barberCreate>;

export const barberPatch = barberFields
  .partial()
  .refine(
    (patch) => Object.keys(patch).length > 0,
    "Change at least one field",
  );
export type BarberPatch = z.input<typeof barberPatch>;

/**
 * A future booking the admin should look at after a change, e.g. one that
 * now falls outside the barber's new hours. Includes the phone, so the
 * admin can call the customer.
 */
export const bookingToReview = z.object({
  reference: z.string(),
  start: z.iso.datetime(),
  date: localDate,
  label: localTime,
  customerName: z.string(),
  customerPhone: z.string(),
  service: z.object({ id, name: z.string() }),
});
export type BookingToReview = z.infer<typeof bookingToReview>;

/** A barber after a change, with the future bookings it leaves to review. */
export const barberChange = z.object({
  barber: adminBarber,
  bookingsToReview: z.array(bookingToReview),
});
export type BarberChange = z.infer<typeof barberChange>;

export const idParams = z.object({ id });
