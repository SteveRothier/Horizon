import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GeoLocation } from "@/types/weather";

type FavoritesState = {
  favorites: GeoLocation[];
  addFavorite: (location: GeoLocation) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (location: GeoLocation) => void;
  isFavorite: (id: string) => boolean;
  clearFavorites: () => void;
};

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (location) =>
        set((state) => {
          if (state.favorites.some((f) => f.id === location.id)) return state;
          return { favorites: [location, ...state.favorites] };
        }),
      removeFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
        })),
      toggleFavorite: (location) => {
        const { favorites, addFavorite, removeFavorite } = get();
        if (favorites.some((f) => f.id === location.id)) {
          removeFavorite(location.id);
        } else {
          addFavorite(location);
        }
      },
      isFavorite: (id) => get().favorites.some((f) => f.id === id),
      clearFavorites: () => set({ favorites: [] }),
    }),
    { name: "horizon-favorites" },
  ),
);
