import { apiError } from "@intromax/barbershop-contracts";
import { sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import type { Db } from "../db/client";
import { errorBody } from "../http/errors";

/**
 * GET /health, for the host and uptime monitors: 200 when the API can reach
 * its database, 503 when it can't. Outside /v1: it's part of the
 * infrastructure, not the versioned API.
 */
export const healthRoutes: FastifyPluginAsyncZod<{ db: Db }> = async (
  app,
  { db },
) => {
  app.get(
    "/health",
    {
      schema: {
        response: { 200: z.object({ ok: z.literal(true) }), 503: apiError },
      },
    },
    async (request, reply) => {
      try {
        await db.execute(sql`select 1`);
        return { ok: true as const };
      } catch (error) {
        request.log.error(error, "health check: database unreachable");
        return reply
          .code(503)
          .send(errorBody("db_unavailable", "Database unreachable"));
      }
    },
  );
};
