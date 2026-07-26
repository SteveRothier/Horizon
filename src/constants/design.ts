import type { WeatherCondition, DayPeriod } from "@/types/weather";

/** Default scene while weather data is not loaded yet */
export const DEFAULT_WEATHER: WeatherCondition = "clear";
export const DEFAULT_PERIOD: DayPeriod = "day";

export const BREAKPOINTS = {
  mobile: 390,
  tablet: 768,
  laptop: 1280,
  desktop: 1440,
} as const;
