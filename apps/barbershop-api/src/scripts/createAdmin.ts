import { z } from "zod";
import { adminInput, createAdmin } from "../auth/admins";
import { createDb } from "../db/client";
import { loadEnv, requireEnv } from "../env";
import { createPrompter } from "./prompt";

/*
 * Creates an admin account from the terminal:
 *   pnpm nx create-admin barbershop-api
 * Asks for an email, a name and a password (typed hidden, twice).
 */

loadEnv();
const prompt = createPrompter();
const { db, pool } = createDb(requireEnv("DATABASE_URL"));

try {
  const email = await prompt.ask("Email: ");
  const name = await prompt.ask("Name: ");
  const password = await prompt.askHidden("Password (12+ characters): ");
  const repeated = await prompt.askHidden("Repeat password: ");

  const parsed = adminInput.safeParse({ email, name, password });
  if (!parsed.success) {
    throw new Error(z.prettifyError(parsed.error));
  }
  if (password !== repeated) throw new Error("The passwords don't match.");

  const admin = await createAdmin(db, parsed.data);
  console.log(`Admin ${admin.email} created.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  prompt.close();
  await pool.end();
}
