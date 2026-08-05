import type { WeatherCondition, DayPeriod } from "@/types/weather";

/** Default scene while weather data is not loaded yet */
export const DEFAULT_WEATHER: WeatherCondition = "clear";
export const DEFAULT_PERIOD: DayPeriod = "day";

/** Shared scene backdrop — AppShell fallback + WeatherBackground. */
export const SCENE_GRADIENT =
  "linear-gradient(145deg, var(--scene-from) 0%, var(--scene-via) 48%, var(--scene-to) 100%)";
