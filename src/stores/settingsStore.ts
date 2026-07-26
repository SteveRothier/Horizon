import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TemperatureUnit = "celsius" | "fahrenheit";

type SettingsState = {
  temperatureUnit: TemperatureUnit;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  toggleTemperatureUnit: () => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      temperatureUnit: "celsius",
      setTemperatureUnit: (unit) => set({ temperatureUnit: unit }),
      toggleTemperatureUnit: () =>
        set({
          temperatureUnit:
            get().temperatureUnit === "celsius" ? "fahrenheit" : "celsius",
        }),
    }),
    { name: "horizon-settings" },
  ),
);
