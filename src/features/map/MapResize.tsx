"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

type MapResizeProps = {
  expanded: boolean;
};

export function MapResize({ expanded }: MapResizeProps) {
  const map = useMap();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      map.invalidateSize();
    });
    return () => cancelAnimationFrame(frame);
  }, [expanded, map]);

  return null;
}
