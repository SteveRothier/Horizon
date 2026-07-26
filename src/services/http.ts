import { DEFAULT_FETCH_TIMEOUT_MS } from "@/constants/api";
import { AppApiError } from "@/types/api";

type FetchJsonOptions = RequestInit & {
  timeoutMs?: number;
};

export async function fetchJson<T>(
  url: string,
  options: FetchJsonOptions = {},
): Promise<T> {
  const { timeoutMs = DEFAULT_FETCH_TIMEOUT_MS, ...init } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new AppApiError(
        "API_UNAVAILABLE",
        `Requête échouée (${response.status})`,
        response.status >= 500 ? 502 : response.status,
      );
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof AppApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new AppApiError(
        "TIMEOUT",
        "La requête a expiré. Réessayez.",
        504,
      );
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      throw new AppApiError(
        "OFFLINE",
        "Pas de connexion Internet.",
        503,
      );
    }
    throw new AppApiError(
      "API_UNAVAILABLE",
      "Service météo indisponible.",
      502,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
