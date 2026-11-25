import { describe, expect, it } from "vitest";
import { type DayHours, freeSlots } from "./slots";

// New York is UTC-5 in December (EST): 09:00 local is 14:00Z.
const DATE = "2026-12-01";
const NOW = new Date("2026-11-30T12:00:00Z");

function hours(
  startsAt: string,
  endsAt: string,
  breakTime?: [string, string],
): DayHours {
  return {
    startsAt,
    endsAt,
    breakStartsAt: breakTime?.[0] ?? null,
    breakEndsAt: breakTime?.[1] ?? null,
  };
}

function labels(input: Partial<Parameters<typeof freeSlots>[0]>) {
  return freeSlots({
    date: DATE,
    timezone: "America/New_York",
    hours: hours("09:00", "11:00"),
    durationMinutes: 30,
    bookings: [],
    now: NOW,
    ...input,
  }).map((slot) => slot.label);
}

describe("freeSlots", () => {
  it("offers every 15 minutes while the whole service fits before the end", () => {
    // A 45-minute service in 09:00-11:00: 10:15 ends exactly at 11:00.
    expect(labels({ durationMinutes: 45 })).toEqual([
      "09:00",
      "09:15",
      "09:30",
      "09:45",
      "10:00",
      "10:15",
    ]);
  });

  it("starts on the grid when the hours don't", () => {
    expect(labels({ hours: hours("09:10", "10:00") })[0]).toBe("09:15");
  });

  it("returns each start as the instant in the shop's timezone", () => {
    const [first] = freeSlots({
      date: DATE,
      timezone: "America/New_York",
      hours: hours("09:00", "10:00"),
      durationMinutes: 30,
      bookings: [],
      now: NOW,
    });
    expect(first?.start.toISOString()).toBe("2026-12-01T14:00:00.000Z");
  });

  it("skips starts that would run into the break", () => {
    expect(
      labels({ hours: hours("09:00", "12:00", ["10:00", "11:00"]) }),
    ).toEqual(["09:00", "09:15", "09:30", "11:00", "11:15", "11:30"]);
  });

  it("skips starts that overlap a booking, but allows back-to-back", () => {
    // Booked 10:00-10:30 local.
    const booking = {
      start: new Date("2026-12-01T15:00:00Z"),
      end: new Date("2026-12-01T15:30:00Z"),
    };
    expect(labels({ bookings: [booking] })).toEqual([
      "09:00",
      "09:15",
      "09:30",
      "10:30",
    ]);
  });

  it("keeps the minimum lead time before the start", () => {
    // 09:30 local now: the first bookable start is 10:30.
    expect(labels({ now: new Date("2026-12-01T14:30:00Z") })).toEqual([
      "10:30",
    ]);
  });

  it("offers nothing past the booking horizon", () => {
    // 2026-12-01 is more than 60 days after 2026-09-01.
    expect(labels({ now: new Date("2026-09-01T12:00:00Z") })).toEqual([]);
  });

  it("uses the offset of the day itself across a DST change", () => {
    // Clocks spring forward on 2026-03-08: 10:00 is UTC-5 the day before,
    // UTC-4 that day.
    const startOf = (date: string) =>
      freeSlots({
        date,
        timezone: "America/New_York",
        hours: hours("10:00", "10:30"),
        durationMinutes: 30,
        bookings: [],
        now: new Date("2026-03-01T12:00:00Z"),
      })[0]?.start.toISOString();

    expect(startOf("2026-03-07")).toBe("2026-03-07T15:00:00.000Z");
    expect(startOf("2026-03-08")).toBe("2026-03-08T14:00:00.000Z");
  });

  it("skips the hour that doesn't exist when the clocks spring forward", () => {
    // On 2026-03-08 New York goes from 01:59 straight to 03:00.
    const slots = freeSlots({
      date: "2026-03-08",
      timezone: "America/New_York",
      hours: hours("01:00", "04:00"),
      durationMinutes: 30,
      bookings: [],
      now: new Date("2026-03-01T12:00:00Z"),
    });
    expect(slots.map((slot) => slot.label)).toEqual([
      "01:00",
      "01:15",
      "01:30",
      "01:45",
      "03:00",
      "03:15",
      "03:30",
    ]);
    expect(
      slots.find((slot) => slot.label === "03:00")?.start.toISOString(),
    ).toBe("2026-03-08T07:00:00.000Z");
  });
});
