import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import type { Db } from "../../db/client";
import { requireAdmin } from "../../http/auth";
import { adminBarberRoutes } from "./barbers";
import { adminBookingRoutes } from "./bookings";
import { adminServiceRoutes } from "./services";

/**
 * Everything under /v1/admin. The admin check is one hook for the whole
 * plugin, so no admin route can be added without it. It runs on request,
 * before the body is read, so a caller without a session learns nothing
 * about what a route expects.
 */
export const adminRoutes: FastifyPluginAsyncZod<{
  db: Db;
  now: () => Date;
}> = async (app, { db, now }) => {
  // Only db and now are passed on: the options also carry this plugin's own
  // prefix, which would otherwise be applied a second time.
  app.addHook("onRequest", requireAdmin({ db, now }));
  app.register(adminServiceRoutes, { db });
  app.register(adminBarberRoutes, { db, now });
  app.register(adminBookingRoutes, { db, now });
};
