import { describe, expect, it } from "vitest";
import { weekdaysOutsideOpeningHours } from "./openingHours";

// Monday 09:00-19:00 (as Postgres returns times); closed on Sunday.
const opening = [{ weekday: 1, opensAt: "09:00:00", closesAt: "19:00:00" }];

describe("weekdaysOutsideOpeningHours", () => {
  it("accepts a day inside the opening hours, including exactly on the edges", () => {
    expect(
      weekdaysOutsideOpeningHours(
        [{ weekday: 1, startsAt: "09:00", endsAt: "19:00" }],
        opening,
      ),
    ).toEqual([]);
  });

  it("flags a day that starts too early or ends too late", () => {
    expect(
      weekdaysOutsideOpeningHours(
        [{ weekday: 1, startsAt: "08:30", endsAt: "18:00" }],
        opening,
      ),
    ).toEqual([1]);
    expect(
      weekdaysOutsideOpeningHours(
        [{ weekday: 1, startsAt: "10:00", endsAt: "19:15" }],
        opening,
      ),
    ).toEqual([1]);
  });

  it("flags a working day when the shop is closed", () => {
    expect(
      weekdaysOutsideOpeningHours(
        [{ weekday: 0, startsAt: "10:00", endsAt: "14:00" }],
        opening,
      ),
    ).toEqual([0]);
  });
});
