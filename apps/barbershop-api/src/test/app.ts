import { type App, type AppDeps, buildApp } from "../app";
import { createSession } from "../auth/sessions";
import type { Db } from "../db/client";
import { inRolledBackTransaction } from "./db";
import { addAdmin } from "./fixtures";

/**
 * Runs `run` against an app whose database work is rolled back afterwards.
 * `run` also gets the same `db`, to insert fixtures the requests will see.
 */
export function withApp(
  run: (app: App, db: Db) => Promise<void>,
  deps: Omit<AppDeps, "db"> = {},
) {
  return inRolledBackTransaction(async (db) => {
    const app = buildApp({ ...deps, db });
    try {
      await run(app, db);
    } finally {
      await app.close();
    }
  });
}

/**
 * Signs a new admin in (a session made directly, no login request) and
 * returns a request helper for /v1/admin that sends their cookie.
 */
export async function signInAsAdmin(app: App, db: Db, now: Date) {
  const admin = await addAdmin(db);
  const { token } = await createSession(db, admin.id, now);
  return (
    method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
    url: string,
    payload?: object,
  ) =>
    app.inject({
      method,
      url: `/v1/admin${url}`,
      cookies: { session: token },
      ...(payload && { payload }),
    });
}
