export const OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
export const OPEN_METEO_AIR_URL =
  "https://air-quality-api.open-meteo.com/v1/air-quality";
export const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";
export const NOMINATIM_SEARCH_URL =
  "https://nominatim.openstreetmap.org/search";
export const NOMINATIM_REVERSE_URL =
  "https://nominatim.openstreetmap.org/reverse";

/** Horizon User-Agent required by Nominatim usage policy */
export const NOMINATIM_USER_AGENT =
  "HorizonWeather/1.0 (portfolio; contact@horizon.app)";

export const DEFAULT_FETCH_TIMEOUT_MS = 12_000;
export const WEATHER_STALE_TIME_MS = 5 * 60 * 1000;
export const GEOCODE_STALE_TIME_MS = 30 * 60 * 1000;
