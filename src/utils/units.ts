import type { TemperatureUnit } from "@/stores/settingsStore";

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
