"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

type MapResizeProps = {
  expanded: boolean;
  resizeTick?: number;
  /** While true, skip invalidate — avoids tile flash mid-FLIP. */
  animating?: boolean;
};

export function MapResize({
  expanded,
  resizeTick = 0,
  animating = false,
}: MapResizeProps) {
  const map = useMap();

  useEffect(() => {
    if (animating) return;
    const frame = requestAnimationFrame(() => {
      map.invalidateSize({ animate: false, pan: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [expanded, resizeTick, animating, map]);

  return null;
}
