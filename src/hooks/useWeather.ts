"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAndSeedWeather } from "@/hooks/fetchWeather";
import {
  airQualityQueryKey,
  weatherQueryDefaults,
  weatherQueryKey,
} from "@/hooks/query-keys";
import { clientFetchJson } from "@/services/client-api";
import type { AirQualityData } from "@/types/weather";

type WeatherCoords = { lat: number; lon: number } | null;

export function useWeather(coords: WeatherCoords, enabled = true) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: weatherQueryKey(coords?.lat, coords?.lon),
    queryFn: () => fetchAndSeedWeather(coords!.lat, coords!.lon, queryClient),
    enabled: enabled && coords != null,
    staleTime: weatherQueryDefaults.staleTime,
    placeholderData: (previousData) => previousData,
  });
}

/** Fallback when weather.airQuality is missing — not the primary path. */
export function useAirQuality(coords: WeatherCoords, enabled = true) {
  return useQuery({
    queryKey: airQualityQueryKey(coords?.lat, coords?.lon),
    queryFn: () =>
      clientFetchJson<AirQualityData>(
        `/api/air-quality?lat=${coords!.lat}&lon=${coords!.lon}`,
      ),
    enabled: enabled && coords != null,
    staleTime: weatherQueryDefaults.staleTime,
  });
}
