import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { users } from "../db/schema";
import { inRolledBackTransaction } from "../test/db";
import { AdminExistsError, adminInput, createAdmin } from "./admins";
import { verifyPassword } from "./password";

describe("createAdmin", () => {
  it("stores an admin whose password verifies, never the password itself", () =>
    inRolledBackTransaction(async (db) => {
      const admin = await createAdmin(db, {
        email: "owner@example.com",
        name: "Owner",
        password: "a long admin password",
      });

      const [row] = await db.select().from(users).where(eq(users.id, admin.id));
      expect(row?.role).toBe("admin");
      expect(row?.passwordHash).not.toContain("a long admin password");
      expect(
        await verifyPassword("a long admin password", row?.passwordHash ?? ""),
      ).toBe(true);
    }));

  it("refuses a second account with the same email in another case", () =>
    inRolledBackTransaction(async (db) => {
      await createAdmin(db, {
        email: "owner@example.com",
        name: "Owner",
        password: "a long admin password",
      });
      await expect(
        createAdmin(db, {
          email: "Owner@Example.com",
          name: "Owner again",
          password: "another long password",
        }),
      ).rejects.toBeInstanceOf(AdminExistsError);
    }));
});

describe("adminInput", () => {
  it("requires a real email and a password of 12+ characters", () => {
    const result = adminInput.safeParse({
      email: "nope",
      name: "Owner",
      password: "short",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual([
      "email",
      "password",
    ]);
  });
});
