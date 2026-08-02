import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GeoLocation } from "@/types/weather";

const PARIS: GeoLocation = {
  id: "paris-default",
  name: "Paris",
  country: "France",
  countryCode: "FR",
  admin1: "Île-de-France",
  latitude: 48.8566,
  longitude: 2.3522,
  displayName: "Paris, France",
};

type LocationState = {
  location: GeoLocation;
  setLocation: (location: GeoLocation) => void;
};

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      location: PARIS,
      setLocation: (location) => set({ location }),
    }),
    { name: "horizon-location" },
  ),
);
