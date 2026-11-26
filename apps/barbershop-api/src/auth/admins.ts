import { z } from "zod";
import type { Db } from "../db/client";
import { PG_UNIQUE_VIOLATION, postgresError } from "../db/errors";
import { users } from "../db/schema";
import { hashPassword } from "./password";

export const MIN_PASSWORD_LENGTH = 12;

export const adminInput = z.object({
  email: z.email(),
  name: z.string().trim().min(1).max(100),
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Use at least ${MIN_PASSWORD_LENGTH} characters`),
});
export type AdminInput = z.infer<typeof adminInput>;

/** An account with this email (in any letter case) already exists. */
export class AdminExistsError extends Error {
  constructor(email: string) {
    super(`An account with ${email} already exists.`);
    this.name = "AdminExistsError";
  }
}

/**
 * Creates an admin account. There is no sign-up endpoint: this, run from the
 * `create-admin` script, is the only way an admin comes to exist.
 */
export async function createAdmin(db: Db, input: AdminInput) {
  const passwordHash = await hashPassword(input.password);
  try {
    const [admin] = await db
      .insert(users)
      .values({
        email: input.email,
        name: input.name,
        role: "admin",
        passwordHash,
      })
      .returning({ id: users.id, email: users.email });
    if (!admin) throw new Error("Inserting the admin returned nothing");
    return admin;
  } catch (error) {
    const pg = postgresError(error);
    if (
      pg?.code === PG_UNIQUE_VIOLATION &&
      pg.constraint === "users_email_lower_unique"
    ) {
      throw new AdminExistsError(input.email);
    }
    throw error;
  }
}
