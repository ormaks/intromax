import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyServerOptions } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import type { Db } from "./db/client";
import { originCheck } from "./http/auth";
import { clientIp } from "./http/clientIp";
import { errorHandler, notFoundHandler } from "./http/errors";
import { adminRoutes } from "./routes/admin";
import { authRoutes } from "./routes/auth";
import { availabilityRoutes } from "./routes/availability";
import { bookingRoutes } from "./routes/bookings";
import { catalogueRoutes } from "./routes/catalogue";
import { healthRoutes } from "./routes/health";
import { shopRoutes } from "./routes/shop";

export type AppDeps = {
  db: Db;
  /** The clock. Tests pass a fixed one so time-based rules are repeatable. */
  now?: () => Date;
  /** The only origin allowed to send state-changing browser requests. */
  frontendOrigin?: string;
  /** Shared with the frontend's proxy; see `clientIp`. Unset: never trust. */
  proxySecret?: string;
};

/**
 * Builds the Fastify app without starting it: `server.ts` calls `listen()`,
 * and tests send requests through `app.inject()` instead, with no port.
 */
export function buildApp(
  {
    db,
    now = () => new Date(),
    frontendOrigin = "http://localhost:3000",
    proxySecret,
  }: AppDeps,
  options: FastifyServerOptions = {},
) {
  const app = Fastify(options).withTypeProvider<ZodTypeProvider>();

  // Route schemas are zod: validate requests with them, and serialise
  // responses through them, which drops any field the contract doesn't list.
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  app.decorateRequest("user", null);
  app.addHook("onRequest", originCheck(frontendOrigin));
  app.register(cookie);

  // Counters live in this process's memory, which is enough for one
  // instance. No route is limited unless it sets `config.rateLimit`.
  app.register(rateLimit, {
    global: false,
    keyGenerator: (request) => clientIp(request, proxySecret),
  });

  app.register(healthRoutes, { db });
  app.register(shopRoutes, { db, prefix: "/v1" });
  app.register(catalogueRoutes, { db, prefix: "/v1" });
  app.register(availabilityRoutes, { db, now, prefix: "/v1" });
  app.register(bookingRoutes, { db, now, prefix: "/v1" });
  app.register(authRoutes, { db, now, prefix: "/v1" });
  app.register(adminRoutes, { db, now, prefix: "/v1/admin" });

  return app;
}

export type App = ReturnType<typeof buildApp>;
