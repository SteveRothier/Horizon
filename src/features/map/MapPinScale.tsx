"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

/** Scale factor for map pins from Leaflet zoom (smaller when zoomed out). */
function pinScaleForZoom(zoom: number): number {
  if (zoom >= 12) return 1;
  if (zoom >= 10) return 0.9;
  if (zoom >= 8) return 0.78;
  if (zoom >= 6) return 0.65;
  return 0.52;
}

/** Keeps `--map-pin-scale` in sync with map zoom. */
export function MapPinScale() {
  const map = useMap();

  useEffect(() => {
    const apply = () => {
      map
        .getContainer()
        .style.setProperty("--map-pin-scale", String(pinScaleForZoom(map.getZoom())));
    };
    apply();
    map.on("zoom", apply);
    map.on("zoomend", apply);
    return () => {
      map.off("zoom", apply);
      map.off("zoomend", apply);
    };
  }, [map]);

  return null;
}
