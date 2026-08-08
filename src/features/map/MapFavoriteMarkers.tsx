"use client";

import { useEffect } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { favoritePinIcon } from "@/features/map/map-markers";
import type { MapPinCoords } from "@/features/map/MapClickPreview";
import { useFavoritesStore } from "@/stores/favoritesStore";
import type { GeoLocation } from "@/types/weather";
import { sameLocation } from "@/utils/location-match";

type MapFavoriteMarkersProps = {
  active: GeoLocation;
  onSelectPin: (pin: MapPinCoords) => void;
};

export function MapFavoriteMarkers({
  active,
  onSelectPin,
}: MapFavoriteMarkersProps) {
  const map = useMap();
  const favorites = useFavoritesStore((s) => s.favorites);

  useEffect(() => {
    const group = L.layerGroup();

    for (const fav of favorites) {
      if (sameLocation(fav, active)) continue;
      const marker = L.marker([fav.latitude, fav.longitude], {
        icon: favoritePinIcon,
        title: fav.name,
      });
      marker.on("click", (event) => {
        L.DomEvent.stopPropagation(event);
        onSelectPin({ lat: fav.latitude, lon: fav.longitude });
      });
      group.addLayer(marker);
    }

    map.addLayer(group);
    return () => {
      map.removeLayer(group);
      group.clearLayers();
    };
  }, [map, favorites, active, onSelectPin]);

  return null;
}
