import type { WeatherCondition } from "@/types/weather";

/** Map WMO weather interpretation codes (Open-Meteo) to app conditions */
export function conditionFromWeatherCode(code: number): WeatherCondition {
  if (code === 0) return "clear";
  if (code === 1 || code === 2 || code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (
    code === 51 ||
    code === 53 ||
    code === 55 ||
    code === 56 ||
    code === 57 ||
    code === 61 ||
    code === 63 ||
    code === 65 ||
    code === 66 ||
    code === 67 ||
    code === 80 ||
    code === 81 ||
    code === 82
  ) {
    return "rain";
  }
  if (code === 71 || code === 73 || code === 75 || code === 77 || code === 85 || code === 86) {
    return "snow";
  }
  if (code === 95 || code === 96 || code === 99) return "storm";
  return "cloudy";
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

const FR_DESCRIPTIONS: Record<WeatherCondition, { day: string; night: string }> =
  {
    clear: { day: "Ensoleillé", night: "Ciel dégagé" },
    cloudy: { day: "Nuageux", night: "Nuageux" },
    rain: { day: "Pluvieux", night: "Pluvieux" },
    storm: { day: "Orageux", night: "Orageux" },
    snow: { day: "Neigeux", night: "Neigeux" },
    fog: { day: "Brouillard", night: "Brouillard" },
  };

export function descriptionFromCondition(
  condition: WeatherCondition,
  isDay: boolean,
  override?: string,
): string {
  if (override) return override;
  const entry = FR_DESCRIPTIONS[condition];
  return isDay ? entry.day : entry.night;
}

/** European AQI (0–100+) rough label */
export function aqiLabelFromIndex(aqi: number | null): string {
  if (aqi == null || Number.isNaN(aqi)) return "Indisponible";
  if (aqi <= 20) return "Excellente";
  if (aqi <= 40) return "Bonne";
  if (aqi <= 60) return "Moyenne";
  if (aqi <= 80) return "Mauvaise";
  if (aqi <= 100) return "Très mauvaise";
  return "Extrêmement mauvaise";
}

export function slugifyCity(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
