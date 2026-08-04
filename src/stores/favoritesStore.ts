import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GeoLocation } from "@/types/weather";
import { dedupeLocations, sameLocation } from "@/utils/location-match";

export const FAVORITES_MAX = 10;

type FavoritesState = {
  favorites: GeoLocation[];
  addFavorite: (location: GeoLocation) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (location: GeoLocation) => void;
  isFavorite: (location: GeoLocation | string) => boolean;
  clearFavorites: () => void;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (location) =>
        set((state) => {
          if (state.favorites.some((f) => sameLocation(f, location))) {
            return state;
          }
          return {
            favorites: [location, ...state.favorites].slice(0, FAVORITES_MAX),
          };
        }),
      removeFavorite: (id) =>
        set((state) => {
          const target = state.favorites.find((f) => f.id === id);
          if (!target) {
            return {
              favorites: state.favorites.filter((f) => f.id !== id),
            };
          }
          return {
            favorites: state.favorites.filter((f) => !sameLocation(f, target)),
          };
        }),
      toggleFavorite: (location) => {
        const { favorites, addFavorite, removeFavorite } = get();
        const existing = favorites.find((f) => sameLocation(f, location));
        if (existing) {
          removeFavorite(existing.id);
        } else {
          addFavorite(location);
        }
      },
      isFavorite: (locationOrId) => {
        const { favorites } = get();
        if (typeof locationOrId === "string") {
          return favorites.some((f) => f.id === locationOrId);
        }
        return favorites.some((f) => sameLocation(f, locationOrId));
      },
      clearFavorites: () => set({ favorites: [] }),
    }),
    {
      name: "horizon-favorites",
      merge: (persisted, current) => {
        const stored = (persisted ?? {}) as Partial<FavoritesState>;
        return {
          ...current,
          ...stored,
          favorites: dedupeLocations(
            stored.favorites ?? current.favorites,
          ).slice(0, FAVORITES_MAX),
        };
      },
    },
  ),
);
