import { AppApiError, type ApiErrorCode } from "@/types/api";
import type { MessageKey } from "@/i18n/messages";

const CODE_TO_KEY: Partial<Record<ApiErrorCode, MessageKey>> = {
  OFFLINE: "error.offline",
  TIMEOUT: "error.timeout",
  CITY_NOT_FOUND: "error.cityNotFound",
  API_UNAVAILABLE: "error.apiUnavailable",
  GEOLOCATION_DENIED: "geo.denied",
  BAD_REQUEST: "error.badRequest",
};

type Translate = (
  key: MessageKey,
  vars?: Record<string, string | number>,
) => string;

/** Map API / network errors to localized user-facing messages. */
export function messageFromApiError(
  error: unknown,
  t: Translate,
  fallbackKey: MessageKey = "error.weather",
): string {
  if (error instanceof AppApiError) {
    const key = CODE_TO_KEY[error.code];
    if (key) return t(key);
    if (error.message) return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return t(fallbackKey);
}
