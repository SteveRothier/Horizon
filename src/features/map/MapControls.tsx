"use client";

import type { ReactNode } from "react";
import { Crosshair, Maximize2, Minimize2, Minus, Plus } from "lucide-react";
import { useMap } from "react-leaflet";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";

const ZOOM_DURATION_S = 0.55;

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
      onClick={onClick}
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

  const zoomOpts = { animate: true as const, duration: ZOOM_DURATION_S };

  return (
    <div
      className="pointer-events-none absolute right-3 top-3 z-[1000] flex items-center gap-1.5"
      role="toolbar"
      aria-label={t("map.controls")}
    >
      <div className="pointer-events-auto flex items-center gap-1.5">
        <MapControlButton
          label={t("map.zoomOut")}
          onClick={() => {
            map.setZoom(map.getZoom() - 1, zoomOpts);
          }}
        >
          <Minus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
        </MapControlButton>
        <MapControlButton
          label={t("map.zoomIn")}
          onClick={() => {
            map.setZoom(map.getZoom() + 1, zoomOpts);
          }}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
        </MapControlButton>
        <MapControlButton
          label={t("map.recenter")}
          onClick={() => {
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
