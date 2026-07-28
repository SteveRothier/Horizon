import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GeoLocation } from "@/types/weather";
import { dedupeLocations, sameLocation } from "@/utils/location-match";

export const HISTORY_MAX = 10;

type HistoryState = {
  items: GeoLocation[];
  addToHistory: (location: GeoLocation) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
};

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      items: [],
      addToHistory: (location) =>
        set((state) => {
          const without = state.items.filter(
            (item) => !sameLocation(item, location),
          );
          return {
            items: [location, ...without].slice(0, HISTORY_MAX),
          };
        }),
      removeFromHistory: (id) =>
        set((state) => {
          const target = state.items.find((item) => item.id === id);
          if (!target) {
            return { items: state.items.filter((item) => item.id !== id) };
          }
          return {
            items: state.items.filter((item) => !sameLocation(item, target)),
          };
        }),
      clearHistory: () => set({ items: [] }),
    }),
    {
      name: "horizon-history",
      merge: (persisted, current) => {
        const stored = (persisted ?? {}) as Partial<HistoryState>;
        return {
          ...current,
          ...stored,
          items: dedupeLocations(stored.items ?? current.items).slice(
            0,
            HISTORY_MAX,
          ),
        };
      },
    },
  ),
);
