import { useHistoryStore } from "@/stores/historyStore";
import { useLocationStore } from "@/stores/locationStore";
import type { GeoLocation } from "@/types/weather";

/** Set current city and push it to recent history (max 10, deduped). */
export function selectLocation(location: GeoLocation) {
  useLocationStore.getState().setLocation(location);
  useHistoryStore.getState().addToHistory(location);
}
