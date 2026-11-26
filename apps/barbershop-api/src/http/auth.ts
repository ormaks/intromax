import type {
  FastifyReply,
  FastifyRequest,
  onRequestHookHandler,
  preHandlerHookHandler,
} from "fastify";
import { type SessionUser, validateSession } from "../auth/sessions";
import type { Db } from "../db/client";
import { HttpError } from "./errors";

declare module "fastify" {
  interface FastifyRequest {
    /** The signed-in user, set by `requireAdmin`; null on public routes. */
    user: SessionUser | null;
  }
}

export const SESSION_COOKIE = "session";

/**
 * - HttpOnly: page scripts can't read it, so an XSS bug can't steal it.
 * - Secure: sent over HTTPS only (browsers treat localhost as secure too).
 * - SameSite=Lax: not attached to cross-site POSTs, the main CSRF defence.
 */
export function setSessionCookie(
  reply: FastifyReply,
  token: string,
  expiresAt: Date,
) {
  reply.setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export function clearSessionCookie(reply: FastifyReply) {
  reply.clearCookie(SESSION_COOKIE, { path: "/" });
}

export function sessionToken(request: FastifyRequest) {
  return request.cookies[SESSION_COOKIE];
}

/**
 * Lets the request through only with a valid admin session: 401 without
 * one. Sets `request.user`, and refreshes the cookie when the session slid
 * forward.
 */
export function requireAdmin({
  db,
  now,
}: {
  db: Db;
  now: () => Date;
}): preHandlerHookHandler {
  return async (request, reply) => {
    const token = sessionToken(request);
    const session = token ? await validateSession(db, token, now()) : null;
    if (!token || !session) {
      throw new HttpError(401, "unauthorized", "Sign in to continue.");
    }
    if (session.user.role !== "admin") {
      throw new HttpError(403, "forbidden", "Admins only.");
    }
    if (session.renewed) setSessionCookie(reply, token, session.expiresAt);
    request.user = session.user;
  };
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * Rejects state-changing requests sent from another site. Browsers always
 * send Origin on those, so a page elsewhere can't make a signed-in admin's
 * browser change anything here (CSRF). Requests without Origin aren't from
 * a browser (curl, server-to-server), and carry no browser cookies to abuse.
 */
export function originCheck(frontendOrigin: string): onRequestHookHandler {
  return async (request) => {
    if (SAFE_METHODS.has(request.method)) return;
    const origin = request.headers.origin;
    if (origin !== undefined && origin !== frontendOrigin) {
      throw new HttpError(
        403,
        "forbidden_origin",
        "Requests from this site aren't allowed.",
      );
    }
  };
}
