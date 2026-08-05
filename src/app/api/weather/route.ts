import { reverseGeocode, searchCities } from "@/services/nominatim";
import { getAirQuality, getWeatherBundle } from "@/services/weather";
import { AppApiError } from "@/types/api";
import type { GeoLocation } from "@/types/weather";
import { cachedJson } from "@/utils/api-cache";
import { jsonError, parseCoord } from "@/utils/api-response";

export const runtime = "nodejs";

/**
 * GET /api/weather?lat=&lon=
 * GET /api/weather?q=Paris
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon");

    if (lat && lon) {
      const latitude = parseCoord(lat, "lat");
      const longitude = parseCoord(lon, "lon");
      const provisional: GeoLocation = {
        id: `${latitude.toFixed(4)},${longitude.toFixed(4)}`,
        name: "Ma position",
        country: "",
        latitude,
        longitude,
        displayName: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
      };

      // Reverse geocode + weather + AQI in parallel (weather only needs lat/lon).
      const [location, weather, airQuality] = await Promise.all([
        reverseGeocode(latitude, longitude).catch(() => provisional),
        getWeatherBundle(provisional),
        getAirQuality(latitude, longitude).catch(() => null),
      ]);

      return cachedJson(
        {
          ...weather,
          location,
          airQuality,
        },
        300,
      );
    }

    if (q && q.trim().length >= 2) {
      const results = await searchCities(q.trim(), 1);
      const location = results[0];
      const [weather, airQuality] = await Promise.all([
        getWeatherBundle(location),
        getAirQuality(location.latitude, location.longitude).catch(() => null),
      ]);
      return cachedJson({ ...weather, airQuality }, 300);
    }

    throw new AppApiError(
      "BAD_REQUEST",
      "Fournissez q ou lat & lon.",
      400,
    );
  } catch (error) {
    return jsonError(error);
  }
}
