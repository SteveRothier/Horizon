import type { SpeedUnit, TemperatureUnit } from "@/stores/settingsStore";

export function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}

export function toDisplayTemp(celsius: number, unit: TemperatureUnit): number {
  return unit === "fahrenheit" ? celsiusToFahrenheit(celsius) : celsius;
}

export function formatTemp(
  celsius: number,
  unit: TemperatureUnit,
  digits = 0,
): string {
  const value = toDisplayTemp(celsius, unit);
  const rounded =
    digits === 0 ? Math.round(value) : Number(value.toFixed(digits));
  return `${rounded}°`;
}

export function tempUnitLabel(unit: TemperatureUnit): string {
  return unit === "fahrenheit" ? "°F" : "°C";
}

export function kmhToMph(kmh: number): number {
  return kmh * 0.621371;
}

export function toDisplaySpeed(kmh: number, unit: SpeedUnit): number {
  return unit === "mph" ? kmhToMph(kmh) : kmh;
}

export function formatSpeed(kmh: number, unit: SpeedUnit, digits = 0): string {
  const value = toDisplaySpeed(kmh, unit);
  const rounded =
    digits === 0 ? Math.round(value) : Number(value.toFixed(digits));
  return `${rounded} ${unit === "mph" ? "mph" : "km/h"}`;
}

/** Distance display follows speed unit (metric km vs imperial mi). */
export function formatVisibility(
  meters: number | null,
  unit: SpeedUnit,
  digits = 1,
): string {
  if (meters == null) return "—";
  if (unit === "mph") {
    const miles = meters / 1609.344;
    return `${miles.toFixed(digits)} mi`;
  }
  return `${(meters / 1000).toFixed(digits)} km`;
}
