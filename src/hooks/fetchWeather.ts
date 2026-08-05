import type { QueryClient } from "@tanstack/react-query";
import { airQualityQueryKey } from "@/hooks/query-keys";
import { clientFetchJson } from "@/services/client-api";
import type { WeatherBundle } from "@/types/weather";

/**
 * Single client entry for weather: GET /api/weather and seed AQI cache.
 */
export async function fetchAndSeedWeather(
  lat: number,
  lon: number,
  queryClient: QueryClient,
): Promise<WeatherBundle> {
  const data = await clientFetchJson<WeatherBundle>(
    `/api/weather?lat=${lat}&lon=${lon}`,
  );
  if (data.airQuality) {
    queryClient.setQueryData(airQualityQueryKey(lat, lon), data.airQuality);
  }
  return data;
}
