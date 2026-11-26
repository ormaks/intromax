import {
  adminService,
  adminServiceList,
  idParams,
  serviceCreate,
  servicePatch,
} from "@intromax/barbershop-contracts";
import { asc, eq } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { Db } from "../../db/client";
import { PG_FOREIGN_KEY_VIOLATION, postgresError } from "../../db/errors";
import { services } from "../../db/schema";
import { HttpError, NotFoundError } from "../../http/errors";

/** /v1/admin/services: the catalogue of services, inactive ones included. */
export const adminServiceRoutes: FastifyPluginAsyncZod<{ db: Db }> = async (
  app,
  { db },
) => {
  app.get(
    "/services",
    { schema: { response: { 200: adminServiceList } } },
    async () => ({
      services: await db
        .select()
        .from(services)
        .orderBy(asc(services.sortOrder), asc(services.name)),
    }),
  );

  app.post(
    "/services",
    { schema: { body: serviceCreate, response: { 201: adminService } } },
    async (request, reply) => {
      const [created] = await db
        .insert(services)
        .values(request.body)
        .returning();
      reply.code(201);
      return created;
    },
  );

  app.patch(
    "/services/:id",
    {
      schema: {
        params: idParams,
        body: servicePatch,
        response: { 200: adminService },
      },
    },
    async (request) => {
      const [updated] = await db
        .update(services)
        .set(request.body)
        .where(eq(services.id, request.params.id))
        .returning();
      if (!updated) throw new NotFoundError("Service not found");
      return updated;
    },
  );

  app.delete(
    "/services/:id",
    { schema: { params: idParams } },
    async (request, reply) => {
      try {
        const [deleted] = await db
          .delete(services)
          .where(eq(services.id, request.params.id))
          .returning({ id: services.id });
        if (!deleted) throw new NotFoundError("Service not found");
      } catch (error) {
        // Bookings keep their service (ON DELETE RESTRICT), so the database
        // refuses; no count-then-delete race to get wrong.
        const pg = postgresError(error);
        if (
          pg?.code === PG_FOREIGN_KEY_VIOLATION &&
          pg.constraint === "bookings_service_id_services_id_fk"
        ) {
          throw new HttpError(
            409,
            "in_use",
            "This service has bookings. Deactivate it instead.",
          );
        }
        throw error;
      }
      return reply.code(204).send();
    },
  );
};
