"use client";

import { useEffect } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import { favoritePinIcon } from "@/features/map/map-markers";
import type { MapPinCoords } from "@/features/map/MapClickPreview";
import { useFavoritesStore } from "@/stores/favoritesStore";
import type { GeoLocation } from "@/types/weather";
import { sameLocation } from "@/utils/location-match";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

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
    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
    });

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
      cluster.addLayer(marker);
    }

    map.addLayer(cluster);
    return () => {
      map.removeLayer(cluster);
      cluster.clearLayers();
    };
  }, [map, favorites, active, onSelectPin]);

  return null;
}
