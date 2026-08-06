"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

type MapResizeProps = {
  /** Bump to force a size pass (e.g. after overlay mount). */
  resizeTick?: number;
};

/** Invalidate Leaflet size once on mount and when resizeTick changes. */
export function MapResize({ resizeTick = 0 }: MapResizeProps) {
  const map = useMap();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      map.invalidateSize({ animate: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [resizeTick, map]);

  return null;
}
