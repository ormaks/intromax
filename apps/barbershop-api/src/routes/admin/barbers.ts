import {
  adminBarber,
  adminBarberList,
  barberChange,
  barberCreate,
  barberPatch,
  idParams,
  weekHoursPut,
} from "@intromax/barbershop-contracts";
import { eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import {
  findAdminBarber,
  listAdminBarbers,
  replaceWeekHours,
  toReview,
  upcomingBookings,
} from "../../admin/barbers";
import type { Db } from "../../db/client";
import { PG_FOREIGN_KEY_VIOLATION, postgresError } from "../../db/errors";
import { barbers } from "../../db/schema";
import { HttpError, NotFoundError } from "../../http/errors";
import { isOutsideHours } from "../../schedule/outsideHours";
import { shopTimezone } from "../lookups";

/** /v1/admin/barbers: barbers and their weekly hours, inactive ones included. */
export const adminBarberRoutes: FastifyPluginAsyncZod<{
  db: Db;
  now: () => Date;
}> = async (app, { db, now }) => {
  async function requireBarber(id: string) {
    const barber = await findAdminBarber(db, id);
    if (!barber) throw new NotFoundError("Barber not found");
    return barber;
  }

  app.get(
    "/barbers",
    { schema: { response: { 200: adminBarberList } } },
    async () => ({ barbers: await listAdminBarbers(db) }),
  );

  app.post(
    "/barbers",
    { schema: { body: barberCreate, response: { 201: adminBarber } } },
    async (request, reply) => {
      const { hours, ...fields } = request.body;
      // One transaction: hours outside opening hours undo the barber too.
      const id = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(barbers)
          .values(fields)
          .returning({ id: barbers.id });
        if (!created) throw new Error("Inserting the barber returned nothing");
        if (hours) await replaceWeekHours(tx, created.id, hours);
        return created.id;
      });
      reply.code(201);
      return requireBarber(id);
    },
  );

  app.patch(
    "/barbers/:id",
    {
      schema: {
        params: idParams,
        body: barberPatch,
        response: { 200: barberChange },
      },
    },
    async (request) => {
      const [updated] = await db
        .update(barbers)
        .set(request.body)
        .where(eq(barbers.id, request.params.id))
        .returning({ id: barbers.id });
      if (!updated) throw new NotFoundError("Barber not found");

      // A deactivated barber disappears for guests, but their bookings stay;
      // list the upcoming ones so the admin can move or cancel them.
      const bookingsToReview =
        request.body.isActive === false
          ? await reviewList(updated.id, () => true)
          : [];
      return { barber: await requireBarber(updated.id), bookingsToReview };
    },
  );

  app.delete(
    "/barbers/:id",
    { schema: { params: idParams } },
    async (request, reply) => {
      try {
        const [deleted] = await db
          .delete(barbers)
          .where(eq(barbers.id, request.params.id))
          .returning({ id: barbers.id });
        if (!deleted) throw new NotFoundError("Barber not found");
      } catch (error) {
        // Bookings keep their barber (ON DELETE RESTRICT), so the database
        // refuses; their hours go with them (ON DELETE CASCADE).
        const pg = postgresError(error);
        if (
          pg?.code === PG_FOREIGN_KEY_VIOLATION &&
          pg.constraint === "bookings_barber_id_barbers_id_fk"
        ) {
          throw new HttpError(
            409,
            "in_use",
            "This barber has bookings. Deactivate them instead.",
          );
        }
        throw error;
      }
      return reply.code(204).send();
    },
  );

  app.put(
    "/barbers/:id/hours",
    {
      schema: {
        params: idParams,
        body: weekHoursPut,
        response: { 200: barberChange },
      },
    },
    async (request) => {
      const { id } = request.params;
      const { hours } = request.body;
      await db.transaction(async (tx) => {
        // Locking the barber's row makes two saves for one barber take
        // turns (each replaces the whole week), and a barber deleted
        // meanwhile is a 404 rather than a failed insert.
        const [locked] = await tx
          .select({ id: barbers.id })
          .from(barbers)
          .where(eq(barbers.id, id))
          .for("update");
        if (!locked) throw new NotFoundError("Barber not found");
        await replaceWeekHours(tx, id, hours);
      });

      // Saved regardless; upcoming bookings the new week no longer covers
      // come back for the admin to move or cancel.
      const timezone = await shopTimezone(db);
      const bookingsToReview = await reviewList(id, (booking) =>
        isOutsideHours(booking.during, hours, timezone),
      );
      return { barber: await requireBarber(id), bookingsToReview };
    },
  );

  /** The barber's upcoming bookings that `keep` selects, ready to show. */
  async function reviewList(
    barberId: string,
    keep: (
      booking: Awaited<ReturnType<typeof upcomingBookings>>[number],
    ) => boolean,
  ) {
    const timezone = await shopTimezone(db);
    const upcoming = await upcomingBookings(db, barberId, now());
    return upcoming.filter(keep).map((booking) => toReview(booking, timezone));
  }
};
