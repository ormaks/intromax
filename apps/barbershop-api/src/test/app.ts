import { type App, type AppDeps, buildApp } from "../app";
import type { Db } from "../db/client";
import { inRolledBackTransaction } from "./db";

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
