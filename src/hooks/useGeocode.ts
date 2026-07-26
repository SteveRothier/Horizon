"use client";

import { useQuery } from "@tanstack/react-query";
import { GEOCODE_STALE_TIME_MS } from "@/constants/api";
import { clientFetchJson } from "@/services/client-api";
import type { GeoLocation } from "@/types/weather";

type GeocodeSearchResponse = { results: GeoLocation[] };
type GeocodeReverseResponse = { location: GeoLocation };

export function useCitySearch(query: string, enabled = true) {
  const q = query.trim();

  return useQuery({
    queryKey: ["geocode", "search", q],
    queryFn: () =>
      clientFetchJson<GeocodeSearchResponse>(
        `/api/geocode?q=${encodeURIComponent(q)}`,
      ),
    enabled: enabled && q.length >= 2,
    staleTime: GEOCODE_STALE_TIME_MS,
    select: (data) => data.results,
  });
}

export function useReverseGeocode(
  lat: number | null,
  lon: number | null,
  enabled = true,
) {
  return useQuery({
    queryKey: ["geocode", "reverse", lat, lon],
    queryFn: () =>
      clientFetchJson<GeocodeReverseResponse>(
        `/api/geocode?lat=${lat}&lon=${lon}`,
      ),
    enabled: enabled && lat != null && lon != null,
    staleTime: GEOCODE_STALE_TIME_MS,
    select: (data) => data.location,
  });
}
