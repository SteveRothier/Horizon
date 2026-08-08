import type { WeatherCondition } from "@/types/weather";
import type { AppLocale } from "@/stores/settingsStore";
import { translate, type MessageKey } from "@/i18n/messages";

/** Map WMO weather interpretation codes (Open-Meteo) to app conditions */
export function conditionFromWeatherCode(code: number): WeatherCondition {
  if (code === 0) return "clear";
  if (code === 1 || code === 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code === 51 || code === 53 || code === 55) return "drizzle";
  if (code === 56 || code === 57 || code === 66 || code === 67) {
    return "freezing";
  }
  if (
    code === 61 ||
    code === 63 ||
    code === 65 ||
    code === 80 ||
    code === 81 ||
    code === 82
  ) {
    return "rain";
  }
  if (
    code === 71 ||
    code === 73 ||
    code === 75 ||
    code === 77 ||
    code === 85 ||
    code === 86
  ) {
    return "snow";
  }
  if (code === 96 || code === 99) return "hail";
  if (code === 95) return "storm";
  return "cloudy";
}

/** Chart-facing precip type derived from WMO code (finer than WeatherCondition). */
export type PrecipKind =
  | "none"
  | "drizzle"
  | "rain"
  | "freezing"
  | "snow"
  | "storm"
  | "hail";

export function precipKindFromWeatherCode(code: number): PrecipKind {
  if (code === 96 || code === 99) return "hail";
  if (code === 95) return "storm";
  if (
    code === 71 ||
    code === 73 ||
    code === 75 ||
    code === 77 ||
    code === 85 ||
    code === 86
  ) {
    return "snow";
  }
  if (code === 56 || code === 57 || code === 66 || code === 67) {
    return "freezing";
  }
  if (code === 51 || code === 53 || code === 55) return "drizzle";
  if (
    code === 61 ||
    code === 63 ||
    code === 65 ||
    code === 80 ||
    code === 81 ||
    code === 82
  ) {
    return "rain";
  }
  return "none";
}

/** Fill color for precip area — intensity t in 0..1. */
export function precipFillColor(kind: PrecipKind, t: number): string {
  const intensity = Math.min(1, Math.max(0, t));
  const a = (0.04 + intensity * 0.5).toFixed(3);
  switch (kind) {
    case "snow":
      return `rgba(220, 240, 255, ${a})`;
    case "storm":
      return `rgba(168, 130, 255, ${a})`;
    case "hail":
      return `rgba(255, 176, 96, ${a})`;
    case "freezing":
      return `rgba(110, 230, 235, ${a})`;
    case "drizzle":
      return `rgba(170, 210, 255, ${a})`;
    case "rain":
    case "none":
    default: {
      const r = Math.round(120 - intensity * 55);
      const g = Math.round(205 - intensity * 55);
      return `rgba(${r}, ${g}, 255, ${a})`;
    }
  }
}

/** Stroke color for precip line — intensity t in 0..1. */
export function precipStrokeColor(kind: PrecipKind, t: number): string {
  const intensity = Math.min(1, Math.max(0, t));
  switch (kind) {
    case "snow":
      return `rgba(230, 245, 255, ${0.55 + intensity * 0.4})`;
    case "storm":
      return `rgba(186, 150, 255, ${0.65 + intensity * 0.35})`;
    case "hail":
      return `rgba(255, 190, 110, ${0.7 + intensity * 0.3})`;
    case "freezing":
      return `rgba(120, 235, 240, ${0.65 + intensity * 0.35})`;
    case "drizzle":
      return `rgba(180, 215, 255, ${0.55 + intensity * 0.4})`;
    case "rain":
    case "none":
    default:
      return `rgba(110, 200, 255, ${0.65 + intensity * 0.35})`;
  }
}

/** Approximate WMO code from OpenWeather main + id */
export function weatherCodeFromOpenWeather(
  weatherId: number,
  main: string,
): number {
  const m = main.toLowerCase();
  if (weatherId >= 200 && weatherId < 300) return 95;
  if (weatherId >= 300 && weatherId < 400) return 51;
  if (weatherId >= 500 && weatherId < 600) {
    if (weatherId >= 520) return 80;
    return weatherId === 511 ? 66 : 61;
  }
  if (weatherId >= 600 && weatherId < 700) return 71;
  if (weatherId >= 700 && weatherId < 800) return 45;
  if (weatherId === 800) return 0;
  if (weatherId === 801) return 1;
  if (weatherId === 802) return 2;
  if (weatherId >= 803) return 3;
  if (m.includes("thunder")) return 95;
  if (m.includes("drizzle")) return 51;
  if (m.includes("rain")) return 61;
  if (m.includes("snow")) return 71;
  if (m.includes("fog") || m.includes("mist") || m.includes("haze")) return 45;
  if (m.includes("clear")) return 0;
  return 2;
}

export function descriptionFromCondition(
  condition: WeatherCondition,
  isDay: boolean,
  override?: string,
  locale: AppLocale = "fr",
): string {
  if (override) return override;
  const key =
    `condition.${condition}.${isDay ? "day" : "night"}` satisfies string as MessageKey;
  return translate(locale, key);
}

/** European AQI (0–100+) rough label */
export function aqiLabelFromIndex(
  aqi: number | null,
  locale: AppLocale = "fr",
): string {
  if (aqi == null || Number.isNaN(aqi)) {
    return translate(locale, "aqi.unavailable");
  }
  if (aqi <= 20) return translate(locale, "aqi.excellent");
  if (aqi <= 40) return translate(locale, "aqi.good");
  if (aqi <= 60) return translate(locale, "aqi.moderate");
  if (aqi <= 80) return translate(locale, "aqi.poor");
  if (aqi <= 100) return translate(locale, "aqi.veryPoor");
  return translate(locale, "aqi.extreme");
}

export function slugifyCity(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
