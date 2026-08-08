import { describe, expect, it } from "vitest";
import { AppApiError } from "@/types/api";
import { parseCoord } from "@/utils/api-response";

describe("parseCoord", () => {
  it("parses finite numbers", () => {
    expect(parseCoord("48.85", "lat")).toBe(48.85);
    expect(parseCoord("-2.3", "lon")).toBe(-2.3);
  });

  it("rejects missing values", () => {
    expect(() => parseCoord(null, "lat")).toThrow(AppApiError);
    expect(() => parseCoord("", "lat")).toThrow(AppApiError);
  });

  it("rejects non-numeric values", () => {
    expect(() => parseCoord("abc", "lat")).toThrow(AppApiError);
  });
});
