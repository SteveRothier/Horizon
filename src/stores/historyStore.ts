import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GeoLocation } from "@/types/weather";

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
          const without = state.items.filter((item) => item.id !== location.id);
          return {
            items: [location, ...without].slice(0, HISTORY_MAX),
          };
        }),
      removeFromHistory: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      clearHistory: () => set({ items: [] }),
    }),
    { name: "horizon-history" },
  ),
);
