"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

type MapResizeProps = {
  expanded: boolean;
  resizeTick?: number;
  /** Keep invalidating Leaflet size while the shell morphs. */
  animating?: boolean;
};

export function MapResize({
  expanded,
  resizeTick = 0,
  animating = false,
}: MapResizeProps) {
  const map = useMap();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      map.invalidateSize({ animate: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [expanded, resizeTick, map]);

  useEffect(() => {
    if (!animating) return;
    let raf = 0;
    const tick = () => {
      map.invalidateSize({ animate: false });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animating, map]);

  return null;
}
