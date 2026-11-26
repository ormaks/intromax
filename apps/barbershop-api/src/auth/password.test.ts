import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

// Cheaper parameters keep the tests fast; the format and logic are the same.
const FAST = { ln: 10, r: 8, p: 1 };

describe("password hashing", () => {
  it("verifies the right password and rejects a wrong one", async () => {
    const stored = await hashPassword("correct horse battery", FAST);
    expect(await verifyPassword("correct horse battery", stored)).toBe(true);
    expect(await verifyPassword("correct horse batterY", stored)).toBe(false);
  });

  it("salts every hash, so the same password never hashes the same", async () => {
    const a = await hashPassword("same password", FAST);
    const b = await hashPassword("same password", FAST);
    expect(a).not.toBe(b);
  });

  it("stores its parameters, and verifies with the stored ones", async () => {
    const stored = await hashPassword("old cost", FAST);
    expect(stored).toMatch(/^\$scrypt\$ln=10,r=8,p=1\$[^$]+\$[^$]+$/);
    // Verifying doesn't use the current defaults (ln=17); it reads ln=10.
    expect(await verifyPassword("old cost", stored)).toBe(true);
  });

  it("hashes with the full default cost", async () => {
    const stored = await hashPassword("default cost");
    expect(stored.startsWith("$scrypt$ln=17,r=8,p=1$")).toBe(true);
    expect(await verifyPassword("default cost", stored)).toBe(true);
  });
});
