import {
  QueryClient,
  dehydrate,
  type DehydratedState,
} from "@tanstack/react-query";
import {
  airQualityQueryKey,
  geocodeSearchQueryKey,
  weatherQueryDefaults,
  weatherQueryKey,
} from "@/hooks/query-keys";
import { searchCities } from "@/services/nominatim";
import { getAirQuality, getWeatherBundle } from "@/services/weather";
import type { WeatherBundle } from "@/types/weather";
import { queryFromSlug } from "@/utils/city-url";

/**
 * Prefetch geocode + weather (+ AQI) for a city slug on the server.
 * Returns dehydrated RQ state for HydrationBoundary.
 */
export async function dehydrateCityWeather(
  citySlug: string,
): Promise<DehydratedState | null> {
  const q = queryFromSlug(citySlug);
  if (q.length < 2) return null;

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: weatherQueryDefaults.staleTime,
      },
    },
  });

  try {
    const results = await searchCities(q, 1);
    queryClient.setQueryData(geocodeSearchQueryKey(q), { results });

    const location = results[0];
    if (!location) {
      return dehydrate(queryClient);
    }

    const [weather, airQuality] = await Promise.all([
      getWeatherBundle(location),
      getAirQuality(location.latitude, location.longitude).catch(() => null),
    ]);

    const bundle: WeatherBundle = {
      ...weather,
      location,
      airQuality,
    };

    queryClient.setQueryData(
      weatherQueryKey(location.latitude, location.longitude),
      bundle,
    );
    if (airQuality) {
      queryClient.setQueryData(
        airQualityQueryKey(location.latitude, location.longitude),
        airQuality,
      );
    }

    return dehydrate(queryClient);
  } catch {
    return null;
  }
}
