import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GeoLocation } from "@/types/weather";
import { coordsFromLocation } from "@/utils/location-match";

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

function normalizeLocation(location: GeoLocation): GeoLocation {
  const coords = coordsFromLocation(location);
  if (!coords) return PARIS;
  return {
    ...location,
    latitude: coords.lat,
    longitude: coords.lon,
  };
}

type LocationState = {
  location: GeoLocation;
  setLocation: (location: GeoLocation) => void;
};

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      location: PARIS,
      setLocation: (location) => set({ location: normalizeLocation(location) }),
    }),
    {
      name: "horizon-location",
      merge: (persisted, current) => {
        const raw = persisted as Partial<LocationState> | undefined;
        if (!raw?.location) return current;
        return {
          ...current,
          ...raw,
          location: normalizeLocation(raw.location as GeoLocation),
        };
      },
    },
  ),
);
