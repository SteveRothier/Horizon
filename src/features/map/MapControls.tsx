"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Crosshair, Maximize2, Minimize2, Minus, Plus } from "lucide-react";
import { useMap } from "react-leaflet";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";

const ZOOM_DURATION_S = 0.35;

type MapControlsProps = {
  expanded: boolean;
  onToggleExpand: () => void;
  lat: number;
  lon: number;
};

function MapControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      onDoubleClick={(event) => {
        // Prevent Leaflet map doubleClickZoom from stealing rapid clicks.
        event.preventDefault();
        event.stopPropagation();
      }}
      className={cn(
        "glass-control flex h-9 w-9 items-center justify-center",
        "text-[var(--text-primary)]",
      )}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

export function MapControls({
  expanded,
  onToggleExpand,
  lat,
  lon,
}: MapControlsProps) {
  const map = useMap();
  const t = useT();
  /** Target zoom while an animation is in flight — avoids getZoom() bounce. */
  const pendingZoomRef = useRef<number | null>(null);

  useEffect(() => {
    const onZoomEnd = () => {
      if (
        pendingZoomRef.current != null &&
        map.getZoom() === pendingZoomRef.current
      ) {
        pendingZoomRef.current = null;
      }
    };
    map.on("zoomend", onZoomEnd);
    return () => {
      map.off("zoomend", onZoomEnd);
    };
  }, [map]);

  function zoomBy(delta: number) {
    const base = pendingZoomRef.current ?? map.getZoom();
    const next = Math.max(
      map.getMinZoom(),
      Math.min(map.getMaxZoom(), Math.round(base) + delta),
    );
    if (next === map.getZoom() && pendingZoomRef.current == null) return;

    pendingZoomRef.current = next;
    // Cancel in-flight anim so rapid +/- don't snap backward.
    map.stop();
    map.setZoom(next, { animate: true, duration: ZOOM_DURATION_S });
  }

  return (
    <div
      className="pointer-events-none absolute right-3 top-3 z-[1000] flex items-center gap-1.5"
      role="toolbar"
      aria-label={t("map.controls")}
    >
      <div
        className="pointer-events-auto flex items-center gap-1.5"
        onDoubleClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <MapControlButton
          label={t("map.zoomOut")}
          onClick={() => zoomBy(-1)}
        >
          <Minus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
        </MapControlButton>
        <MapControlButton label={t("map.zoomIn")} onClick={() => zoomBy(1)}>
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
        </MapControlButton>
        <MapControlButton
          label={t("map.recenter")}
          onClick={() => {
            pendingZoomRef.current = null;
            map.stop();
            map.flyTo([lat, lon], Math.max(map.getZoom(), 10), {
              duration: 0.75,
            });
          }}
        >
          <Crosshair className="h-4 w-4" strokeWidth={2.5} aria-hidden />
        </MapControlButton>
        <MapControlButton
          label={expanded ? t("map.collapse") : t("map.expand")}
          onClick={onToggleExpand}
        >
          {expanded ? (
            <Minimize2 className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          ) : (
            <Maximize2 className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          )}
        </MapControlButton>
      </div>
    </div>
  );
}
