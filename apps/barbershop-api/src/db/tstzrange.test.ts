import { describe, expect, it } from "vitest";
import { formatTimeRange, parseTimeRange } from "./tstzrange";

describe("parseTimeRange", () => {
  it("reads a range as Postgres prints it", () => {
    const range = parseTimeRange(
      '["2026-12-01 10:00:00+00","2026-12-01 10:30:00+00")',
    );
    expect(range.start.toISOString()).toBe("2026-12-01T10:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-12-01T10:30:00.000Z");
  });

  it("handles fractional seconds and an offset with minutes", () => {
    const range = parseTimeRange(
      '["2026-12-01 15:30:00.5+05:30","2026-12-01 16:00:00+05:30")',
    );
    expect(range.start.toISOString()).toBe("2026-12-01T10:00:00.500Z");
    expect(range.end.toISOString()).toBe("2026-12-01T10:30:00.000Z");
  });

  it("reads back what formatTimeRange writes", () => {
    const range = {
      start: new Date("2026-12-01T10:00:00Z"),
      end: new Date("2026-12-01T10:45:00Z"),
    };
    expect(parseTimeRange(formatTimeRange(range))).toEqual(range);
  });

  it.each([
    "empty",
    '["2026-12-01 10:00:00+00",)',
    '["2026-12-01 10:00:00+00","2026-12-01 10:30:00+00"]',
  ])("rejects %s", (text) => {
    expect(() => parseTimeRange(text)).toThrow();
  });
});
