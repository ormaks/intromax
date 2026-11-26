import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import type { Db } from "../db/client";
import { sessions } from "../db/schema";
import { inRolledBackTransaction } from "../test/db";
import { addAdmin } from "../test/fixtures";
import {
  createSession,
  deleteSession,
  hashToken,
  SESSION_LIFETIME_MS,
  validateSession,
} from "./sessions";

const T0 = new Date("2026-12-01T12:00:00Z");
const days = (n: number) => new Date(T0.getTime() + n * 24 * 60 * 60 * 1000);

async function storedRow(db: Db, token: string) {
  const [row] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, hashToken(token)));
  return row;
}

describe("sessions", () => {
  it("finds the user behind a fresh token, storing only its hash", () =>
    inRolledBackTransaction(async (db) => {
      const admin = await addAdmin(db);
      const { token } = await createSession(db, admin.id, T0);

      const found = await validateSession(db, token, days(1));
      expect(found?.user).toMatchObject({ id: admin.id, role: "admin" });
      expect(found?.renewed).toBe(false);

      const row = await storedRow(db, token);
      expect(row?.id).toBe(hashToken(token));
      expect(JSON.stringify(row)).not.toContain(token);
    }));

  it("rejects an expired session and deletes its row", () =>
    inRolledBackTransaction(async (db) => {
      const admin = await addAdmin(db);
      const { token } = await createSession(db, admin.id, T0);

      expect(await validateSession(db, token, days(30))).toBeNull();
      expect(await storedRow(db, token)).toBeUndefined();
    }));

  it("slides the expiry once less than half the lifetime is left", () =>
    inRolledBackTransaction(async (db) => {
      const admin = await addAdmin(db);
      const { token } = await createSession(db, admin.id, T0);

      // Day 20: 10 of 30 days left, under half, so it renews.
      const found = await validateSession(db, token, days(20));
      expect(found?.renewed).toBe(true);
      expect(found?.expiresAt.getTime()).toBe(
        days(20).getTime() + SESSION_LIFETIME_MS,
      );
      expect((await storedRow(db, token))?.expiresAt).toEqual(found?.expiresAt);
    }));

  it("ends a session on delete", () =>
    inRolledBackTransaction(async (db) => {
      const admin = await addAdmin(db);
      const { token } = await createSession(db, admin.id, T0);

      await deleteSession(db, token);
      expect(await validateSession(db, token, days(1))).toBeNull();
    }));

  it("clears the user's expired sessions when a new one starts", () =>
    inRolledBackTransaction(async (db) => {
      const admin = await addAdmin(db);
      const { token: old } = await createSession(db, admin.id, T0);

      // 40 days on, the old session expired without ever being used again.
      await createSession(db, admin.id, days(40));
      expect(await storedRow(db, old)).toBeUndefined();
    }));

  it("doesn't accept an unknown token", () =>
    inRolledBackTransaction(async (db) => {
      expect(await validateSession(db, "not-a-real-token", T0)).toBeNull();
    }));
});
