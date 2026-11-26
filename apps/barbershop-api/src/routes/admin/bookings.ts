import {
  adminBooking,
  analytics as analyticsResponse,
  analyticsQuery,
  bookingList,
  bookingListQuery,
  bookingPatch,
  idParams,
  overview as overviewResponse,
} from "@intromax/barbershop-contracts";
import { and, eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  findAdminBookingRow,
  listBookings,
  toAdminBooking,
} from "../../admin/bookings";
import { analytics, overview } from "../../admin/stats";
import { assertBookable } from "../../bookings/bookable";
import type { Db } from "../../db/client";
import { PG_EXCLUSION_VIOLATION, postgresError } from "../../db/errors";
import { bookings } from "../../db/schema";
import { HttpError, NotFoundError } from "../../http/errors";
import {
  requireActiveBarber,
  requireActiveService,
  shopTimezone,
} from "../lookups";

/**
 * /v1/admin/bookings, /overview and /analytics: the admin's side of
 * bookings. Only confirmed bookings change; completed and cancelled ones are
 * history, so revenue and stats never shift under the admin.
 */
export const adminBookingRoutes: FastifyPluginAsyncZod<{
  db: Db;
  now: () => Date;
}> = async (app, { db, now }) => {
  async function requireBooking(id: string) {
    const row = await findAdminBookingRow(db, id);
    if (!row) throw new NotFoundError("Booking not found");
    return row;
  }

  function notConfirmed(status: string) {
    return new HttpError(
      409,
      "not_confirmed",
      `This booking is already ${status}.`,
    );
  }

  app.get(
    "/bookings",
    {
      schema: { querystring: bookingListQuery, response: { 200: bookingList } },
    },
    async (request) => listBookings(db, request.query, await shopTimezone(db)),
  );

  app.get(
    "/bookings/:id",
    { schema: { params: idParams, response: { 200: adminBooking } } },
    async (request) =>
      toAdminBooking(
        await requireBooking(request.params.id),
        await shopTimezone(db),
      ),
  );

  app.patch(
    "/bookings/:id",
    {
      schema: {
        params: idParams,
        body: bookingPatch,
        response: { 200: adminBooking },
      },
    },
    async (request) => {
      const { id } = request.params;
      const patch = request.body;
      const current = await requireBooking(id);
      if (current.status !== "confirmed") throw notConfirmed(current.status);

      // Compared with the booking, not just "was it sent": a client that
      // sends back the whole form mustn't trigger a move, or a re-copied
      // price that would rewrite past revenue.
      const serviceChanged =
        patch.serviceId !== undefined && patch.serviceId !== current.service.id;
      const barberChanged =
        patch.barberId !== undefined && patch.barberId !== current.barber.id;
      const start = patch.start ? new Date(patch.start) : current.during.start;
      const timeChanged = start.getTime() !== current.during.start.getTime();
      const moved = serviceChanged || barberChanged || timeChanged;

      const service =
        serviceChanged && patch.serviceId
          ? await requireActiveService(db, patch.serviceId)
          : undefined;
      if (barberChanged && patch.barberId) {
        await requireActiveBarber(db, patch.barberId);
      }
      const barberId =
        barberChanged && patch.barberId ? patch.barberId : current.barber.id;
      // A new service re-copies its price and duration onto the booking.
      const durationMinutes =
        service?.durationMinutes ?? current.durationMinutes;

      const timezone = await shopTimezone(db);
      if (moved) {
        // The guest rules, minus the lead time: the admin may move a booking
        // to any future time that fits the barber's schedule.
        await assertBookable(db, {
          barberId,
          durationMinutes,
          start,
          timezone,
          now: now(),
          leadMinutes: 0,
        });
      }

      try {
        const [updated] = await db
          .update(bookings)
          .set({
            customerName: patch.name,
            customerPhone: patch.phone,
            customerEmail: patch.email,
            // Notes left empty (after trimming) are stored as no notes.
            notes: patch.notes === undefined ? undefined : patch.notes || null,
            ...(moved && {
              barberId,
              serviceId: service?.id ?? current.service.id,
              during: {
                start,
                end: new Date(start.getTime() + durationMinutes * 60_000),
              },
              durationMinutes,
              priceCents: service?.priceCents ?? current.priceCents,
            }),
          })
          // Only if it's still confirmed: a cancel in between wins.
          .where(and(eq(bookings.id, id), eq(bookings.status, "confirmed")))
          .returning({ id: bookings.id });
        if (!updated) {
          throw new HttpError(
            409,
            "not_confirmed",
            "This booking changed meanwhile. Reload it and try again.",
          );
        }
      } catch (error) {
        const pg = postgresError(error);
        if (
          pg?.code === PG_EXCLUSION_VIOLATION &&
          pg.constraint === "bookings_no_overlap"
        ) {
          throw new HttpError(
            409,
            "slot_taken",
            "That time overlaps another booking for this barber.",
          );
        }
        throw error;
      }
      return toAdminBooking(await requireBooking(id), timezone);
    },
  );

  for (const action of ["complete", "cancel"] as const) {
    app.post(
      `/bookings/:id/${action}`,
      { schema: { params: idParams, response: { 200: adminBooking } } },
      async (request) => {
        const { id } = request.params;
        const at = now();
        // One conditional update: two clicks, or a cancel racing a
        // complete, can't both succeed.
        const [changed] = await db
          .update(bookings)
          .set(
            action === "complete"
              ? { status: "completed", completedAt: at }
              : { status: "cancelled", cancelledAt: at },
          )
          .where(and(eq(bookings.id, id), eq(bookings.status, "confirmed")))
          .returning({ id: bookings.id });
        if (!changed) {
          const current = await requireBooking(id);
          throw notConfirmed(current.status);
        }
        return toAdminBooking(await requireBooking(id), await shopTimezone(db));
      },
    );
  }

  app.get(
    "/overview",
    { schema: { response: { 200: overviewResponse } } },
    async () => overview(db, now(), await shopTimezone(db)),
  );

  app.get(
    "/analytics",
    {
      schema: {
        querystring: analyticsQuery,
        response: { 200: analyticsResponse },
      },
    },
    async (request) => analytics(db, request.query, await shopTimezone(db)),
  );
};
