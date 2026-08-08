import { describe, expect, it } from "vitest";
import { isGeolocationError } from "@/utils/locate-user";

describe("isGeolocationError", () => {
  it("accepts objects with numeric code", () => {
    expect(isGeolocationError({ code: 1 })).toBe(true);
    expect(isGeolocationError({ code: -1, message: "unsupported" })).toBe(true);
  });

  it("rejects other values", () => {
    expect(isGeolocationError(null)).toBe(false);
    expect(isGeolocationError(new Error("x"))).toBe(false);
    expect(isGeolocationError({ code: "1" })).toBe(false);
  });
});
