import { describe, expect, it } from "vitest";
import { AppApiError } from "@/types/api";
import { assertRateLimit } from "@/utils/rate-limit";

function req(ip: string) {
  return new Request("http://localhost/api/geocode?q=paris", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("assertRateLimit", () => {
  it("allows requests under the limit", () => {
    const r = req(`test-allow-${Date.now()}`);
    expect(() => assertRateLimit(r, "test-allow", 3, 60_000)).not.toThrow();
    expect(() => assertRateLimit(r, "test-allow", 3, 60_000)).not.toThrow();
    expect(() => assertRateLimit(r, "test-allow", 3, 60_000)).not.toThrow();
  });

  it("throws RATE_LIMITED when exceeded", () => {
    const r = req(`test-block-${Date.now()}`);
    assertRateLimit(r, "test-block", 2, 60_000);
    assertRateLimit(r, "test-block", 2, 60_000);
    expect(() => assertRateLimit(r, "test-block", 2, 60_000)).toThrow(
      AppApiError,
    );
    try {
      assertRateLimit(r, "test-block", 2, 60_000);
    } catch (error) {
      expect(error).toBeInstanceOf(AppApiError);
      expect((error as AppApiError).code).toBe("RATE_LIMITED");
      expect((error as AppApiError).status).toBe(429);
    }
  });
});
