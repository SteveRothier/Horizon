"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

type MapResizeProps = {
  expanded: boolean;
  resizeTick?: number;
};

export function MapResize({ expanded, resizeTick = 0 }: MapResizeProps) {
  const map = useMap();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      map.invalidateSize();
    });
    return () => cancelAnimationFrame(frame);
  }, [expanded, resizeTick, map]);

  return null;
}
