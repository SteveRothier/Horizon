import type { ApiErrorBody, ApiErrorCode } from "@/types/api";
import { AppApiError } from "@/types/api";

export async function clientFetchJson<T>(
  input: string,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      throw new AppApiError("OFFLINE", "Pas de connexion Internet.", 503);
    }
    throw new AppApiError(
      "API_UNAVAILABLE",
      "Impossible de joindre le serveur.",
      502,
    );
  }

  const data = (await response.json().catch(() => null)) as
    | T
    | ApiErrorBody
    | null;

  if (!response.ok) {
    const body = data as ApiErrorBody | null;
    throw new AppApiError(
      (body?.code as ApiErrorCode) ?? "UNKNOWN",
      body?.message ?? "Erreur serveur.",
      response.status,
    );
  }

  return data as T;
}
