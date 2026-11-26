import { buildApp } from "./app";
import { createDb } from "./db/client";
import { loadEnv, optionalOrigin, requireEnv } from "./env";

loadEnv();
const port = Number(process.env.PORT ?? 3001);
const { db, pool } = createDb(requireEnv("DATABASE_URL"));

const app = buildApp(
  {
    db,
    frontendOrigin: optionalOrigin("FRONTEND_ORIGIN"),
    proxySecret: process.env.PROXY_SECRET || undefined,
  },
  { logger: true },
);

// Stop taking requests, let in-flight ones finish, then close the database
// connections, so a restart or deploy never cuts a request off halfway.
async function shutdown(signal: string) {
  app.log.info(`${signal} received, shutting down`);
  try {
    await app.close();
  } catch (error) {
    app.log.error(error, "closing the server failed");
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

// 0.0.0.0: every network interface, which hosts and containers need to reach
// the process from outside.
await app.listen({ port, host: "0.0.0.0" });
