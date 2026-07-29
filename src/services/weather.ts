import { AppApiError } from "@/types/api";
import type { AirQualityData, GeoLocation, WeatherBundle } from "@/types/weather";
import {
  fetchOpenMeteoAirQuality,
  fetchOpenMeteoWeather,
} from "@/services/open-meteo";
import {
  enrichWithOpenWeatherIcons,
  fetchOpenWeatherAirQuality,
  fetchOpenWeatherBundle,
  isOpenWeatherConfigured,
} from "@/services/openweather";

/**
 * Primary: Open-Meteo. Fallback: OpenWeather.
 * Optionally enrich OM data with OW icons/descriptions.
 */
export async function getWeatherBundle(
  location: GeoLocation,
): Promise<WeatherBundle> {
  try {
    const bundle = await fetchOpenMeteoWeather(location);
    if (!isOpenWeatherConfigured()) return bundle;

    // Enrichment is best-effort and time-boxed so OM stays on the hot path.
    try {
      return await Promise.race([
        enrichWithOpenWeatherIcons(bundle),
        new Promise<WeatherBundle>((resolve) => {
          setTimeout(() => resolve(bundle), 600);
        }),
      ]);
    } catch {
      return bundle;
    }
  } catch (primaryError) {
    if (!isOpenWeatherConfigured()) {
      throw primaryError instanceof AppApiError
        ? primaryError
        : new AppApiError(
            "API_UNAVAILABLE",
            "Open-Meteo indisponible et aucun fallback configuré.",
            502,
          );
    }

    try {
      return await fetchOpenWeatherBundle(location);
    } catch {
      throw primaryError instanceof AppApiError
        ? primaryError
        : new AppApiError(
            "API_UNAVAILABLE",
            "Les services météo sont indisponibles.",
            502,
          );
    }
  }
}

export async function getAirQuality(
  latitude: number,
  longitude: number,
): Promise<AirQualityData> {
  try {
    return await fetchOpenMeteoAirQuality(latitude, longitude);
  } catch (primaryError) {
    if (!isOpenWeatherConfigured()) throw primaryError;

    try {
      return await fetchOpenWeatherAirQuality(latitude, longitude);
    } catch {
      throw primaryError instanceof AppApiError
        ? primaryError
        : new AppApiError(
            "API_UNAVAILABLE",
            "Qualité de l’air indisponible.",
            502,
          );
    }
  }
}
