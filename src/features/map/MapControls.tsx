"use client";

import type { ReactNode } from "react";
import { Maximize2, Minimize2, Minus, Plus } from "lucide-react";
import { useMap } from "react-leaflet";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";

type MapControlsProps = {
  expanded: boolean;
  onToggleExpand: () => void;
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

export function MapControls({ expanded, onToggleExpand }: MapControlsProps) {
  const map = useMap();
  const t = useT();

  return (
    <div
      className="pointer-events-none absolute right-3 top-3 z-[1000] flex items-center gap-1.5"
      role="toolbar"
      aria-label={t("map.controls")}
    >
      <div className="pointer-events-auto flex items-center gap-1.5">
        <MapControlButton
          label={t("map.zoomOut")}
          onClick={() => map.zoomOut()}
        >
          <Minus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
        </MapControlButton>
        <MapControlButton label={t("map.zoomIn")} onClick={() => map.zoomIn()}>
          <Plus className="h-4 w-4" strokeWidth={2.5} aria-hidden />
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
