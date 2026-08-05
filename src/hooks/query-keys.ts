import { GEOCODE_STALE_TIME_MS, WEATHER_STALE_TIME_MS } from "@/constants/api";

export const weatherQueryPrefix = ["weather"] as const;
export const airQualityQueryPrefix = ["air-quality"] as const;
export const geocodeQueryPrefix = ["geocode"] as const;

export function weatherQueryKey(lat?: number, lon?: number) {
  return ["weather", lat, lon] as const;
}

export function airQualityQueryKey(lat?: number, lon?: number) {
  return ["air-quality", lat, lon] as const;
}

export function geocodeSearchQueryKey(q: string) {
  return ["geocode", "search", q] as const;
}

export function geocodeReverseQueryKey(lat: number, lon: number) {
  return ["geocode", "reverse", lat, lon] as const;
}

export const weatherQueryDefaults = {
  staleTime: WEATHER_STALE_TIME_MS,
} as const;

export const geocodeQueryDefaults = {
  staleTime: GEOCODE_STALE_TIME_MS,
} as const;
