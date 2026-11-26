import Fastify, { type FastifyServerOptions } from "fastify";
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from "fastify-type-provider-zod";
import type { Db } from "./db/client";
import { errorHandler, notFoundHandler } from "./http/errors";
import { availabilityRoutes } from "./routes/availability";
import { catalogueRoutes } from "./routes/catalogue";
import { healthRoutes } from "./routes/health";
import { shopRoutes } from "./routes/shop";

export type AppDeps = {
  db: Db;
  /** The clock. Tests pass a fixed one so time-based rules are repeatable. */
  now?: () => Date;
};

/**
 * Builds the Fastify app without starting it: `server.ts` calls `listen()`,
 * and tests send requests through `app.inject()` instead, with no port.
 */
export function buildApp(
  { db, now = () => new Date() }: AppDeps,
  options: FastifyServerOptions = {},
) {
  const app = Fastify(options).withTypeProvider<ZodTypeProvider>();

  // Route schemas are zod: validate requests with them, and serialise
  // responses through them, which drops any field the contract doesn't list.
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.setErrorHandler(errorHandler);
  app.setNotFoundHandler(notFoundHandler);

  app.register(healthRoutes, { db });
  app.register(shopRoutes, { db, prefix: "/v1" });
  app.register(catalogueRoutes, { db, prefix: "/v1" });
  app.register(availabilityRoutes, { db, now, prefix: "/v1" });

  return app;
}

export type App = ReturnType<typeof buildApp>;
