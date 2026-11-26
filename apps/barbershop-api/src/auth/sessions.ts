import { createHash, randomBytes } from "node:crypto";
import { and, eq, lte } from "drizzle-orm";
import type { Db } from "../db/client";
import { sessions, users } from "../db/schema";

/*
 * Server-side sessions. The browser holds a random token in a cookie; the
 * database holds only the token's SHA-256. Someone who reads the sessions
 * table (a leaked backup, a SQL injection elsewhere) gets hashes they can't
 * turn back into working cookies.
 *
 * A session lives 30 days and slides: when less than half of that is left,
 * a request pushes the expiry forward again. An admin who keeps using the
 * site stays signed in; an abandoned session dies.
 */

const DAY = 24 * 60 * 60 * 1000;
export const SESSION_LIFETIME_MS = 30 * DAY;
const RENEW_WHEN_LEFT_MS = SESSION_LIFETIME_MS / 2;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "admin";
};

/** SHA-256 in hex: the form a token is stored and looked up in. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Starts a session and returns the token for the cookie. */
export async function createSession(db: Db, userId: string, now: Date) {
  // 32 random bytes: 2^256 possibilities, so guessing a live token is
  // hopeless. base64url keeps it cookie-safe.
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + SESSION_LIFETIME_MS);
  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt });
  // Expired sessions nobody uses again would never be read, so never
  // deleted on use; clear this user's while signing them in.
  await db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), lte(sessions.expiresAt, now)));
  return { token, expiresAt };
}

/**
 * The user behind a token, or null when it's unknown or expired. An expired
 * row is deleted on the way. `expiresAt` comes back moved forward when the
 * session was renewed, so the caller can refresh the cookie to match.
 */
export async function validateSession(
  db: Db,
  token: string,
  now: Date,
): Promise<{ user: SessionUser; expiresAt: Date; renewed: boolean } | null> {
  const id = hashToken(token);
  const [row] = await db
    .select({
      expiresAt: sessions.expiresAt,
      user: {
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      },
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, id));
  if (!row) return null;

  if (row.expiresAt.getTime() <= now.getTime()) {
    await db.delete(sessions).where(eq(sessions.id, id));
    return null;
  }

  if (row.expiresAt.getTime() - now.getTime() < RENEW_WHEN_LEFT_MS) {
    const expiresAt = new Date(now.getTime() + SESSION_LIFETIME_MS);
    await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));
    return { user: row.user, expiresAt, renewed: true };
  }

  return { user: row.user, expiresAt: row.expiresAt, renewed: false };
}

/** Ends a session. Unknown tokens are ignored. */
export async function deleteSession(db: Db, token: string) {
  await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
}
