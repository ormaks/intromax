import type { WorkingDay } from "@intromax/barbershop-contracts";
import { describe, expect, it } from "vitest";
import { isOutsideHours } from "./outsideHours";

// Tuesday 2026-12-01 in New York (UTC-5): 10:00 local is 15:00Z.
const TZ = "America/New_York";
const tuesday = (from: string, to: string) => ({
  start: new Date(`2026-12-01T${from}:00Z`),
  end: new Date(`2026-12-01T${to}:00Z`),
});
const week: WorkingDay[] = [
  {
    weekday: 2,
    startsAt: "09:00",
    endsAt: "15:00",
    break: { startsAt: "12:00", endsAt: "13:00" },
  },
];

describe("isOutsideHours", () => {
  it("keeps a booking inside the day, including one ending exactly at close", () => {
    expect(isOutsideHours(tuesday("15:00", "15:30"), week, TZ)).toBe(false); // 10:00
    expect(isOutsideHours(tuesday("19:30", "20:00"), week, TZ)).toBe(false); // 14:30-15:00
  });

  it("flags one that starts too early or ends too late", () => {
    expect(isOutsideHours(tuesday("13:30", "14:00"), week, TZ)).toBe(true); // 08:30
    expect(isOutsideHours(tuesday("19:45", "20:15"), week, TZ)).toBe(true); // to 15:15
  });

  it("flags one that overlaps the break, but not one that ends as it starts", () => {
    expect(isOutsideHours(tuesday("16:45", "17:15"), week, TZ)).toBe(true); // 11:45
    expect(isOutsideHours(tuesday("16:30", "17:00"), week, TZ)).toBe(false); // to 12:00
  });

  it("flags one on a day off", () => {
    expect(isOutsideHours(tuesday("15:00", "15:30"), [], TZ)).toBe(true);
  });
});
