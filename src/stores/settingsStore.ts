import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TemperatureUnit = "celsius" | "fahrenheit";
export type SpeedUnit = "kmh" | "mph";
export type AppLocale = "fr" | "en";

type SettingsState = {
  temperatureUnit: TemperatureUnit;
  speedUnit: SpeedUnit;
  locale: AppLocale;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  toggleTemperatureUnit: () => void;
  setSpeedUnit: (unit: SpeedUnit) => void;
  toggleSpeedUnit: () => void;
  setLocale: (locale: AppLocale) => void;
  toggleLocale: () => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      temperatureUnit: "celsius",
      speedUnit: "kmh",
      locale: "fr",
      setTemperatureUnit: (unit) => set({ temperatureUnit: unit }),
      toggleTemperatureUnit: () =>
        set({
          temperatureUnit:
            get().temperatureUnit === "celsius" ? "fahrenheit" : "celsius",
        }),
      setSpeedUnit: (unit) => set({ speedUnit: unit }),
      toggleSpeedUnit: () =>
        set({
          speedUnit: get().speedUnit === "kmh" ? "mph" : "kmh",
        }),
      setLocale: (locale) => set({ locale }),
      toggleLocale: () =>
        set({
          locale: get().locale === "fr" ? "en" : "fr",
        }),
    }),
    { name: "horizon-settings" },
  ),
);
