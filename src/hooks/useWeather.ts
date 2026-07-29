"use client";

import { useQuery } from "@tanstack/react-query";
import { WEATHER_STALE_TIME_MS } from "@/constants/api";
import { clientFetchJson } from "@/services/client-api";
import type { AirQualityData, WeatherBundle } from "@/types/weather";

type WeatherCoords = { lat: number; lon: number } | null;

export function useWeather(coords: WeatherCoords, enabled = true) {
  return useQuery({
    queryKey: ["weather", coords?.lat, coords?.lon],
    queryFn: () =>
      clientFetchJson<WeatherBundle>(
        `/api/weather?lat=${coords!.lat}&lon=${coords!.lon}`,
      ),
    enabled: enabled && coords != null,
    staleTime: WEATHER_STALE_TIME_MS,
  });
}

export function useAirQuality(coords: WeatherCoords, enabled = true) {
  return useQuery({
    queryKey: ["air-quality", coords?.lat, coords?.lon],
    queryFn: () =>
      clientFetchJson<AirQualityData>(
        `/api/air-quality?lat=${coords!.lat}&lon=${coords!.lon}`,
      ),
    enabled: enabled && coords != null,
    staleTime: WEATHER_STALE_TIME_MS,
  });
}
