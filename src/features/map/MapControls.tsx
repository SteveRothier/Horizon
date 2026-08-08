"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import L from "leaflet";
import {
  CloudRain,
  Crosshair,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
} from "lucide-react";
import { useMap } from "react-leaflet";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";

const ZOOM_DURATION_S = 0.35;

type MapControlsProps = {
  expanded: boolean;
  onToggleExpand: () => void;
  lat: number;
  lon: number;
  radarEnabled: boolean;
  onToggleRadar: () => void;
};

function MapControlButton({
  label,
  onClick,
  disabled,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      className={cn(
        "glass-control flex h-9 w-9 items-center justify-center",
        "text-[var(--text-primary)] disabled:opacity-60",
        pressed && "ring-1 ring-[var(--accent)]/70",
      )}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

function useBlockMapGestures(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    L.DomEvent.disableClickPropagation(el);
    L.DomEvent.disableScrollPropagation(el);
  }, [ref]);
}

export function MapControls({
  expanded,
  onToggleExpand,
  lat,
  lon,
  radarEnabled,
  onToggleRadar,
}: MapControlsProps) {
  const map = useMap();
  const t = useT();
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const targetZoomRef = useRef<number | null>(null);
  const animatingRef = useRef(false);

  useBlockMapGestures(leftRef);
  useBlockMapGestures(rightRef);

  useEffect(() => {
    const flushTarget = () => {
      animatingRef.current = false;
      const target = targetZoomRef.current;
      if (target == null) return;

      const current = map.getZoom();
      if (Math.abs(current - target) < 0.001) {
        targetZoomRef.current = null;
        return;
      }

      animatingRef.current = true;
      map.setZoom(target, { animate: true, duration: ZOOM_DURATION_S });
    };

    map.on("zoomend", flushTarget);
    return () => {
      map.off("zoomend", flushTarget);
    };
  }, [map]);

  function zoomBy(delta: number) {
    const base = targetZoomRef.current ?? Math.round(map.getZoom());
    const next = Math.max(
      map.getMinZoom(),
      Math.min(map.getMaxZoom(), base + delta),
    );
    targetZoomRef.current = next;

    if (animatingRef.current) return;
    if (Math.abs(map.getZoom() - next) < 0.001) {
      targetZoomRef.current = null;
      return;
    }

    animatingRef.current = true;
    map.setZoom(next, { animate: true, duration: ZOOM_DURATION_S });
  }

  return (
    <>
      <div
        ref={leftRef}
        className="pointer-events-none absolute left-3 top-3 z-[1000]"
      >
        <div className="pointer-events-auto">
          <MapControlButton
            label={t("map.radar")}
            onClick={onToggleRadar}
            pressed={radarEnabled}
          >
            <CloudRain className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          </MapControlButton>
        </div>
      </div>

      <div
        ref={rightRef}
        className="pointer-events-none absolute right-3 top-3 z-[1000] flex items-center gap-1.5"
        role="toolbar"
        aria-label={t("map.controls")}
      >
        <div className="pointer-events-auto flex items-center gap-1.5">
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
              targetZoomRef.current = null;
              animatingRef.current = false;
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
            pressed={expanded}
          >
            {expanded ? (
              <Minimize2 className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            ) : (
              <Maximize2 className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            )}
          </MapControlButton>
        </div>
      </div>

      {radarEnabled ? (
        <div
          className="pointer-events-none absolute bottom-8 left-3 z-[1000] max-w-[11rem]"
          role="note"
          aria-label={t("map.radarLegend")}
        >
          <div className="rounded-md bg-black/55 px-2 py-1.5 text-[0.65rem] text-white/90 shadow-sm backdrop-blur-sm">
            <p className="mb-1 font-medium leading-none">{t("map.radarLegend")}</p>
            <div
              className="h-1.5 w-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, #a8e6ff 0%, #4fc3f7 25%, #43a047 50%, #fdd835 75%, #e53935 100%)",
              }}
              aria-hidden
            />
            <div className="mt-0.5 flex justify-between text-[0.55rem] text-white/65">
              <span>{t("map.radarLegendLow")}</span>
              <span>{t("map.radarLegendHigh")}</span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
