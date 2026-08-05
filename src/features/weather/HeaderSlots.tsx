"use client";

import { memo, useCallback } from "react";
import { SearchBar } from "@/features/header/SearchBar";
import { GeolocationButton } from "@/features/header/GeolocationButton";
import { FavoritesList } from "@/features/favorites/FavoritesList";
import { HistoryList } from "@/features/history/HistoryList";
import { SettingsPanel } from "@/features/settings/SettingsPanel";

export const StableSearchSlot = memo(function StableSearchSlot() {
  return <SearchBar />;
});

export const StableSettingsSlot = memo(function StableSettingsSlot() {
  return <SettingsPanel />;
});

export const StableFavoritesSlot = memo(function StableFavoritesSlot() {
  return <FavoritesList />;
});

export const StableHistorySlot = memo(function StableHistorySlot() {
  return <HistoryList />;
});

type GeoSlotProps = {
  onError: (message: string) => void;
  onSuccess: () => void;
};

export const StableGeolocationSlot = memo(function StableGeolocationSlot({
  onError,
  onSuccess,
}: GeoSlotProps) {
  return <GeolocationButton onError={onError} onSuccess={onSuccess} />;
});

export function useStableGeoHandlers(
  setGeoError: (message: string | null) => void,
) {
  const onError = useCallback(
    (message: string) => setGeoError(message),
    [setGeoError],
  );
  const onSuccess = useCallback(() => setGeoError(null), [setGeoError]);
  return { onError, onSuccess };
}
