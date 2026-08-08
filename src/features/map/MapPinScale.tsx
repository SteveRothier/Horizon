"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { pinScaleForZoom } from "@/features/map/map-pin-scale";

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
