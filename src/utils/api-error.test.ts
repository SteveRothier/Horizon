import { describe, expect, it } from "vitest";
import { AppApiError } from "@/types/api";
import { messageFromApiError } from "@/utils/api-error";
import type { MessageKey } from "@/i18n/messages";

const messages: Partial<Record<MessageKey, string>> = {
  "error.weather": "fallback weather",
  "error.offline": "offline",
  "error.timeout": "timeout",
  "error.cityNotFound": "city not found",
  "error.apiUnavailable": "api down",
  "error.badRequest": "bad request",
  "error.rateLimited": "rate limited",
  "geo.denied": "geo denied",
};

function t(key: MessageKey) {
  return messages[key] ?? key;
}

describe("messageFromApiError", () => {
  it("maps known AppApiError codes to i18n keys", () => {
    expect(messageFromApiError(new AppApiError("OFFLINE", "x", 0), t)).toBe(
      "offline",
    );
    expect(
      messageFromApiError(new AppApiError("RATE_LIMITED", "x", 429), t),
    ).toBe("rate limited");
    expect(
      messageFromApiError(new AppApiError("CITY_NOT_FOUND", "x", 404), t),
    ).toBe("city not found");
  });

  it("falls back to default weather message", () => {
    expect(messageFromApiError(null, t)).toBe("fallback weather");
  });

  it("uses Error.message when not AppApiError", () => {
    expect(messageFromApiError(new Error("boom"), t)).toBe("boom");
  });
});
