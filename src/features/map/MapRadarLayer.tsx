"use client";

import { useEffect, useState } from "react";
import { TileLayer, useMap } from "react-leaflet";
import {
  fetchRainViewerMaps,
  latestRadarFrame,
  RAINVIEWER_ATTRIBUTION,
  RAINVIEWER_MAX_NATIVE_ZOOM,
  RAINVIEWER_MAX_ZOOM,
  RAINVIEWER_OPACITY,
  RAINVIEWER_REFRESH_MS,
  rainviewerTileUrl,
} from "@/features/map/rainviewer";

type MapRadarLayerProps = {
  enabled: boolean;
};

/** RainViewer precipitation overlay above OSM, below markers. */
export function MapRadarLayer({ enabled }: MapRadarLayerProps) {
  const map = useMap();
  const [tileUrl, setTileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!map.getPane("radarPane")) {
      const pane = map.createPane("radarPane");
      pane.style.zIndex = "450";
      pane.style.pointerEvents = "none";
    }
  }, [map]);

  useEffect(() => {
    if (!enabled) {
      setTileUrl(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      try {
        const data = await fetchRainViewerMaps(controller.signal);
        if (cancelled) return;
        const frame = latestRadarFrame(data);
        if (!frame) {
          setTileUrl(null);
          return;
        }
        setTileUrl(rainviewerTileUrl(data.host, frame.path));
      } catch {
        if (!cancelled) setTileUrl(null);
      }
    }

    void load();
    const timer = window.setInterval(() => void load(), RAINVIEWER_REFRESH_MS);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(timer);
    };
  }, [enabled]);

  if (!enabled || !tileUrl) return null;

  return (
    <TileLayer
      key={tileUrl}
      url={tileUrl}
      opacity={RAINVIEWER_OPACITY}
      pane="radarPane"
      attribution={RAINVIEWER_ATTRIBUTION}
      maxNativeZoom={RAINVIEWER_MAX_NATIVE_ZOOM}
      maxZoom={RAINVIEWER_MAX_ZOOM}
    />
  );
}
