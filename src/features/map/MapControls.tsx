"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import L from "leaflet";
import {
  Crosshair,
  LoaderCircle,
  LocateFixed,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
} from "lucide-react";
import { useMap } from "react-leaflet";
import { useFetchReverseGeocode } from "@/hooks/useGeocode";
import { useT } from "@/hooks/useT";
import { AppApiError } from "@/types/api";
import { cn } from "@/utils/cn";
import {
  isGeolocationError,
  locateUserPosition,
} from "@/utils/locate-user";
import { selectLocation } from "@/utils/selectLocation";

const ZOOM_DURATION_S = 0.35;

type MapControlsProps = {
  expanded: boolean;
  onToggleExpand: () => void;
  lat: number;
  lon: number;
  onOpenCity?: () => void;
};

function MapControlButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "glass-control flex h-9 w-9 items-center justify-center",
        "text-[var(--text-primary)] disabled:opacity-60",
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
  onOpenCity,
}: MapControlsProps) {
  const map = useMap();
  const t = useT();
  const fetchReverse = useFetchReverseGeocode();
  const toolbarRef = useRef<HTMLDivElement>(null);
  const targetZoomRef = useRef<number | null>(null);
  const animatingRef = useRef(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const el = toolbarRef.current;
    if (!el) return;
    L.DomEvent.disableClickPropagation(el);
    L.DomEvent.disableScrollPropagation(el);
  }, []);

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

  async function locate() {
    if (locating) return;
    setLocating(true);
    try {
      const location = await locateUserPosition(fetchReverse);
      selectLocation(location);
      map.flyTo([location.latitude, location.longitude], Math.max(map.getZoom(), 11), {
        duration: 0.75,
      });
      onOpenCity?.();
    } catch (err) {
      if (isGeolocationError(err) && err.code === -1) {
        console.warn(t("geo.unsupported"));
      } else if (err instanceof AppApiError) {
        console.warn(err.message);
      } else {
        console.warn(t("geo.failed"));
      }
    } finally {
      setLocating(false);
    }
  }

  return (
    <div
      ref={toolbarRef}
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
          label={t("map.locate")}
          onClick={() => void locate()}
          disabled={locating}
        >
          {locating ? (
            <LoaderCircle className="h-4 w-4 search-spinner" aria-hidden />
          ) : (
            <LocateFixed className="h-4 w-4" strokeWidth={2.5} aria-hidden />
          )}
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
