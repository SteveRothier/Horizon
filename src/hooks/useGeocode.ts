"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  geocodeQueryDefaults,
  geocodeReverseQueryKey,
  geocodeSearchQueryKey,
} from "@/hooks/query-keys";
import { clientFetchJson } from "@/services/client-api";
import type { GeoLocation } from "@/types/weather";

type GeocodeSearchResponse = { results: GeoLocation[] };
type GeocodeReverseResponse = { location: GeoLocation };

export function useCitySearch(query: string, enabled = true) {
  const q = query.trim();

  return useQuery({
    queryKey: geocodeSearchQueryKey(q),
    queryFn: () =>
      clientFetchJson<GeocodeSearchResponse>(
        `/api/geocode?q=${encodeURIComponent(q)}`,
      ),
    enabled: enabled && q.length >= 2,
    staleTime: geocodeQueryDefaults.staleTime,
    select: (data) => data.results,
  });
}

export function useReverseGeocode(
  coords: { lat: number; lon: number } | null,
  enabled = true,
) {
  return useQuery({
    queryKey: geocodeReverseQueryKey(coords?.lat ?? 0, coords?.lon ?? 0),
    queryFn: () =>
      clientFetchJson<GeocodeReverseResponse>(
        `/api/geocode?lat=${coords!.lat}&lon=${coords!.lon}`,
      ),
    enabled: enabled && coords != null,
    staleTime: geocodeQueryDefaults.staleTime,
    select: (data) => data.location,
  });
}

/** One-shot reverse geocode for imperative flows (e.g. geolocation button). */
export function useFetchReverseGeocode() {
  const queryClient = useQueryClient();

  return useCallback(
    async (lat: number, lon: number): Promise<GeoLocation> => {
      const data = await queryClient.fetchQuery({
        queryKey: geocodeReverseQueryKey(lat, lon),
        queryFn: () =>
          clientFetchJson<GeocodeReverseResponse>(
            `/api/geocode?lat=${lat}&lon=${lon}`,
          ),
        staleTime: geocodeQueryDefaults.staleTime,
      });
      return data.location;
    },
    [queryClient],
  );
}
