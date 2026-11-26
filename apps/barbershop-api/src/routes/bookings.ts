import {
  booking,
  bookingAccess,
  createBookingRequest,
} from "@intromax/barbershop-contracts";
import { and, eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { z } from "zod";
import { assertBookable } from "../bookings/bookable";
import { findGuestBooking } from "../bookings/find";
import { newReference } from "../bookings/reference";
import { bookingView } from "../bookings/view";
import type { Db } from "../db/client";
import {
  PG_EXCLUSION_VIOLATION,
  PG_UNIQUE_VIOLATION,
  postgresError,
} from "../db/errors";
import { bookings } from "../db/schema";
import type { TimeRange } from "../db/tstzrange";
import { HttpError } from "../http/errors";
import { GUEST_CANCEL_CUTOFF_MINUTES } from "../schedule/slots";
import {
  requireActiveBarber,
  requireActiveService,
  shopTimezone,
} from "./lookups";

/** How many fresh references to try if one is already taken. */
const REFERENCE_ATTEMPTS = 3;

/*
 * Per-IP rate limits. Booking is limited so one script can't fill the
 * calendar with fake bookings; lookup and cancel are limited so nobody can
 * guess the phone number behind a known reference.
 */
const BOOKING_LIMIT = { max: 10, timeWindow: "1 hour" };
const ACCESS_LIMIT = { max: 10, timeWindow: "1 minute" };

/**
 * The guest's side of bookings: POST /v1/bookings to book, then
 * /v1/bookings/lookup and /v1/bookings/cancel with the reference and phone.
 */
export const bookingRoutes: FastifyPluginAsyncZod<{
  db: Db;
  now: () => Date;
}> = async (app, { db, now }) => {
  app.post(
    "/bookings",
    {
      schema: { body: createBookingRequest, response: { 201: booking } },
      config: { rateLimit: BOOKING_LIMIT },
    },
    async (request, reply) => {
      const body = request.body;
      const start = new Date(body.start);

      const service = await requireActiveService(db, body.serviceId);
      const barber = await requireActiveBarber(db, body.barberId);
      const timezone = await shopTimezone(db);

      await assertBookable(db, {
        barberId: barber.id,
        durationMinutes: service.durationMinutes,
        start,
        timezone,
        now: now(),
      });

      const during: TimeRange = {
        start,
        end: new Date(start.getTime() + service.durationMinutes * 60_000),
      };
      const reference = await insertBooking(db, {
        serviceId: service.id,
        barberId: barber.id,
        during,
        // Snapshots: later changes to the service don't change this booking.
        priceCents: service.priceCents,
        durationMinutes: service.durationMinutes,
        guest: body,
      });

      reply.code(201);
      return bookingView(
        {
          reference,
          status: "confirmed",
          during,
          priceCents: service.priceCents,
          durationMinutes: service.durationMinutes,
          customerName: body.name,
          service: { id: service.id, name: service.name },
          barber,
        },
        timezone,
      );
    },
  );

  // Lookup and cancel take the reference and phone in a POST body rather
  // than a query string, so the phone never lands in URLs, logs or history.

  app.post(
    "/bookings/lookup",
    {
      schema: { body: bookingAccess, response: { 200: booking } },
      config: { rateLimit: ACCESS_LIMIT },
    },
    async (request) => {
      const record = await findGuestBooking(db, request.body);
      return bookingView(record, await shopTimezone(db));
    },
  );

  app.post(
    "/bookings/cancel",
    {
      schema: { body: bookingAccess, response: { 200: booking } },
      config: { rateLimit: ACCESS_LIMIT },
    },
    async (request) => {
      const record = await findGuestBooking(db, request.body);
      const at = now();

      if (record.status !== "confirmed") {
        throw notCancellable(`This booking is already ${record.status}.`);
      }
      const cutoff =
        record.during.start.getTime() - GUEST_CANCEL_CUTOFF_MINUTES * 60_000;
      if (at.getTime() > cutoff) {
        throw notCancellable(
          `Bookings can be cancelled online until ${GUEST_CANCEL_CUTOFF_MINUTES / 60} hours before the start. Please call the shop.`,
        );
      }

      // Only a still-confirmed row changes, so two cancels arriving together
      // can't both succeed: the second updates nothing.
      const [cancelled] = await db
        .update(bookings)
        .set({ status: "cancelled", cancelledAt: at })
        .where(
          and(eq(bookings.id, record.id), eq(bookings.status, "confirmed")),
        )
        .returning({ id: bookings.id });
      if (!cancelled) {
        throw notCancellable(
          "This booking was just changed. Look it up again.",
        );
      }

      return bookingView(
        { ...record, status: "cancelled" },
        await shopTimezone(db),
      );
    },
  );
};

function notCancellable(message: string) {
  return new HttpError(409, "not_cancellable", message);
}

/**
 * Inserts the booking under a fresh reference and returns the reference.
 * An overlap with a live booking (the exclusion constraint) becomes 409
 * `slot_taken`; a reference that already exists is retried with a new one.
 */
async function insertBooking(
  db: Db,
  booking: {
    serviceId: string;
    barberId: string;
    during: TimeRange;
    priceCents: number;
    durationMinutes: number;
    /** The parsed request body: phone already normalised. */
    guest: z.output<typeof createBookingRequest>;
  },
): Promise<string> {
  for (let attempt = 1; ; attempt++) {
    const reference = newReference();
    try {
      await db.insert(bookings).values({
        reference,
        serviceId: booking.serviceId,
        barberId: booking.barberId,
        during: booking.during,
        priceCents: booking.priceCents,
        durationMinutes: booking.durationMinutes,
        customerName: booking.guest.name,
        customerPhone: booking.guest.phone,
        // An empty notes field (after trimming) is stored as no notes.
        customerEmail: booking.guest.email ?? null,
        notes: booking.guest.notes || null,
      });
      return reference;
    } catch (error) {
      const pg = postgresError(error);
      if (
        pg?.code === PG_EXCLUSION_VIOLATION &&
        pg.constraint === "bookings_no_overlap"
      ) {
        throw new HttpError(
          409,
          "slot_taken",
          "Someone just booked that time. Pick another one.",
        );
      }
      if (
        pg?.code === PG_UNIQUE_VIOLATION &&
        pg.constraint === "bookings_reference_unique" &&
        attempt < REFERENCE_ATTEMPTS
      ) {
        continue;
      }
      throw error;
    }
  }
}
