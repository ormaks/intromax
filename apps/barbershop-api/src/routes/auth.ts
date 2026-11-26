import { currentUser, loginRequest } from "@intromax/barbershop-contracts";
import { eq, sql } from "drizzle-orm";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { hashPassword, verifyPassword } from "../auth/password";
import { createSession, deleteSession } from "../auth/sessions";
import type { Db } from "../db/client";
import { users } from "../db/schema";
import {
  clearSessionCookie,
  requireAdmin,
  sessionToken,
  setSessionCookie,
} from "../http/auth";
import { HttpError } from "../http/errors";

/** Per IP: slow enough that guessing a password is hopeless. */
const LOGIN_LIMIT = { max: 5, timeWindow: "15 minutes" };

/**
 * Login checks an unknown email against this hash, so a wrong email takes as
 * long as a wrong password and response times don't reveal which emails have
 * accounts. It's started when the module loads, so no login request ever
 * waits for it to be made.
 */
const hashForUnknownEmail = hashPassword("no account has this password");
// Never leave the startup hash's failure unhandled; login awaits it anyway.
hashForUnknownEmail.catch(() => undefined);

/** POST /v1/auth/login and /logout, GET /v1/auth/me. */
export const authRoutes: FastifyPluginAsyncZod<{
  db: Db;
  now: () => Date;
}> = async (app, { db, now }) => {
  app.post(
    "/auth/login",
    {
      schema: { body: loginRequest, response: { 200: currentUser } },
      config: { rateLimit: LOGIN_LIMIT },
    },
    async (request, reply) => {
      const { email, password } = request.body;

      // Postgres's lower() on both sides: the same case rules as the
      // case-insensitive unique index, which serves this lookup.
      const [user] = await db
        .select()
        .from(users)
        .where(eq(sql`lower(${users.email})`, sql`lower(${email})`));
      const matches = await verifyPassword(
        password,
        user?.passwordHash ?? (await hashForUnknownEmail),
      );
      if (!user || !matches) {
        // One answer for both cases: never say which part was wrong.
        throw new HttpError(
          401,
          "invalid_credentials",
          "Invalid email or password.",
        );
      }

      const { token, expiresAt } = await createSession(db, user.id, now());
      setSessionCookie(reply, token, expiresAt);
      // Listed field by field, so the password hash can't slip into a reply.
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    },
  );

  app.post("/auth/logout", async (request, reply) => {
    const token = sessionToken(request);
    if (token) await deleteSession(db, token);
    clearSessionCookie(reply);
    return reply.code(204).send();
  });

  app.get(
    "/auth/me",
    {
      schema: { response: { 200: currentUser } },
      preHandler: requireAdmin({ db, now }),
    },
    async (request) => {
      // requireAdmin has set it or answered 401.
      if (!request.user) throw new Error("requireAdmin didn't set the user");
      return request.user;
    },
  );
};
