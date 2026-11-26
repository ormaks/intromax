import { phone, reference } from "@intromax/barbershop-contracts";
import { describe, expect, it } from "vitest";
import { newReference } from "./reference";

describe("newReference", () => {
  it("makes codes that are already in the form a lookup normalises to", () => {
    for (let i = 0; i < 1000; i++) {
      const code = newReference();
      expect(reference.parse(code)).toBe(code);
    }
  });
});

describe("reference (contract)", () => {
  it("matches a code however the guest types it", () => {
    for (const typed of ["k7m2 9qxa", "K7M29QXA", " k7m2-9qxa "]) {
      expect(reference.parse(typed)).toBe("K7M2-9QXA");
    }
  });

  it("reads the look-alikes O, I and L as 0 and 1", () => {
    expect(reference.parse("K7MO-9QIL")).toBe("K7M0-9Q11");
  });
});

describe("phone (contract)", () => {
  it("keeps a leading + and the digits", () => {
    expect(phone.parse(" +1 (555) 234-5678 ")).toBe("+15552345678");
    expect(phone.parse("555.234.5678")).toBe("5552345678");
  });

  it("rejects letters and too few digits", () => {
    expect(phone.safeParse("555-CALL-NOW").success).toBe(false);
    expect(phone.safeParse("+1 555").success).toBe(false);
  });
});
