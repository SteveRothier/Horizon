"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { fetchAndSeedWeather } from "@/hooks/fetchWeather";
import {
  weatherQueryDefaults,
  weatherQueryKey,
} from "@/hooks/query-keys";

/** Prefetch weather (+ seed AQI) via the same fetchAndSeedWeather path. */
export function usePrefetchWeather() {
  const queryClient = useQueryClient();

  return useCallback(
    (lat: number, lon: number) => {
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
      void queryClient.prefetchQuery({
        queryKey: weatherQueryKey(lat, lon),
        queryFn: () => fetchAndSeedWeather(lat, lon, queryClient),
        staleTime: weatherQueryDefaults.staleTime,
      });
    },
    [queryClient],
  );
}
