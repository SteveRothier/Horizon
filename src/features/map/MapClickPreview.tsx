"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { ExternalLink, LoaderCircle } from "lucide-react";
import { Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import { WeatherIcon } from "@/components/ui/WeatherIcon";
import { previewPinIcon } from "@/features/map/map-markers";
import { useFetchReverseGeocode, useReverseGeocode } from "@/hooks/useGeocode";
import { useWeather } from "@/hooks/useWeather";
import { useLocale, useT } from "@/hooks/useT";
import { useSettingsStore } from "@/stores/settingsStore";
import { cn } from "@/utils/cn";
import { formatLocalClock } from "@/utils/format";
import { selectLocation } from "@/utils/selectLocation";
import { formatTemp } from "@/utils/units";

const TAP_MAX_MOVE_PX = 10;
const LONG_PRESS_MS = 450;
const SPINNER_DELAY_MS = 120;

export type MapPinCoords = { lat: number; lon: number };

type MapClickPreviewProps = {
  pin: MapPinCoords | null;
  onPinChange: (pin: MapPinCoords | null) => void;
  /** Called after selecting the pinned city (e.g. collapse expanded map). */
  onOpenCity?: () => void;
};

export function MapClickPreview({
  pin,
  onPinChange,
  onOpenCity,
}: MapClickPreviewProps) {
  const t = useT();
  const locale = useLocale();
  const unit = useSettingsStore((s) => s.temperatureUnit);
  const map = useMap();
  const fetchReverse = useFetchReverseGeocode();
  const fetchingRef = useRef(false);
  const markerRef = useRef<L.Marker | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);
  const [showSpinner, setShowSpinner] = useState(false);

  const reverse = useReverseGeocode(pin, pin != null);
  const weather = useWeather(pin, pin != null);

  const hasData = Boolean(reverse.data && weather.data);
  const isFetching = reverse.isFetching || weather.isFetching;
  const loading =
    pin != null &&
    !hasData &&
    (isFetching ||
      (!reverse.isFetched && !reverse.isError) ||
      (!weather.isFetched && !weather.isError));

  const failed =
    pin != null &&
    !loading &&
    !hasData &&
    (reverse.isError || weather.isError);

  useEffect(() => {
    fetchingRef.current = Boolean(pin) && loading;
  }, [pin, loading]);

  useEffect(() => {
    if (!loading) {
      setShowSpinner(false);
      return;
    }
    const timer = window.setTimeout(() => setShowSpinner(true), SPINNER_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [loading]);

  function clearLongPress() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  async function openAt(lat: number, lon: number) {
    if (fetchingRef.current) return;
    try {
      fetchingRef.current = true;
      const location = await fetchReverse(lat, lon);
      selectLocation(location);
      onPinChange(null);
      onOpenCity?.();
    } catch {
      onPinChange({ lat, lon });
    } finally {
      fetchingRef.current = false;
    }
  }

  useMapEvents({
    click(event) {
      if (longPressFiredRef.current) {
        longPressFiredRef.current = false;
        return;
      }
      if (fetchingRef.current) return;
      const start = pointerStartRef.current;
      if (start) {
        const dx = event.originalEvent.clientX - start.x;
        const dy = event.originalEvent.clientY - start.y;
        if (Math.hypot(dx, dy) > TAP_MAX_MOVE_PX) return;
      }
      onPinChange({ lat: event.latlng.lat, lon: event.latlng.lng });
    },
    dblclick(event) {
      event.originalEvent.preventDefault();
      void openAt(event.latlng.lat, event.latlng.lng);
    },
    contextmenu(event) {
      event.originalEvent.preventDefault();
      onPinChange(null);
    },
  });

  useEffect(() => {
    const container = map.getContainer();

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      pointerStartRef.current = { x: event.clientX, y: event.clientY };
      longPressFiredRef.current = false;
      clearLongPress();
      const startX = event.clientX;
      const startY = event.clientY;
      const startLatLng = map.mouseEventToLatLng(event);

      longPressTimerRef.current = setTimeout(() => {
        longPressFiredRef.current = true;
        void openAt(startLatLng.lat, startLatLng.lng);
      }, LONG_PRESS_MS);

      const onMove = (moveEvent: PointerEvent) => {
        if (Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) > TAP_MAX_MOVE_PX) {
          clearLongPress();
        }
      };
      const onUp = () => {
        clearLongPress();
        container.removeEventListener("pointermove", onMove);
        container.removeEventListener("pointerup", onUp);
        container.removeEventListener("pointercancel", onUp);
      };
      container.addEventListener("pointermove", onMove);
      container.addEventListener("pointerup", onUp);
      container.addEventListener("pointercancel", onUp);
    };

    container.addEventListener("pointerdown", onPointerDown);
    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      clearLongPress();
    };
    // openAt / fetchReverse intentionally stable enough via refs for timer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);

  useEffect(() => {
    if (!pin) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onPinChange(null);
    };
    // Capture so expanded map collapse waits for a second Escape.
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [pin, onPinChange]);

  useEffect(() => {
    if (!pin) return;
    const frame = requestAnimationFrame(() => {
      markerRef.current?.openPopup();
    });
    return () => cancelAnimationFrame(frame);
  }, [pin]);

  if (!pin) return null;

  const location = reverse.data;
  const current = weather.data?.current;
  const timezone = weather.data?.timezone;

  function openCity() {
    if (!location) return;
    selectLocation(location);
    onPinChange(null);
    onOpenCity?.();
  }

  return (
    <Marker
      ref={markerRef}
      position={[pin.lat, pin.lon]}
      icon={previewPinIcon}
      eventHandlers={{
        popupclose: () => {
          onPinChange(null);
        },
      }}
    >
      <Popup
        className="map-weather-popup"
        closeButton={false}
        autoPan
        maxWidth={150}
      >
        <div className="map-weather-popup-inner w-[150px] max-w-[150px] text-[var(--text-primary)] leading-none">
          {showSpinner && loading ? (
            <div
              className="flex items-center gap-1 text-[0.7rem] text-[var(--text-secondary)]"
              role="status"
            >
              <LoaderCircle
                className="h-3 w-3 shrink-0 animate-spin"
                aria-hidden
              />
              {t("map.pin.loading")}
            </div>
          ) : failed ? (
            <p className="text-[0.7rem] text-[var(--text-secondary)]">
              {t("map.pin.error")}
            </p>
          ) : location && current ? (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-start gap-1">
                <p className="min-w-0 flex-1 line-clamp-2 text-[0.8rem] font-semibold leading-snug">
                  {location.name}
                </p>
                <button
                  type="button"
                  className={cn(
                    "glass-control flex h-5 w-5 shrink-0 items-center justify-center",
                    "disabled:cursor-not-allowed disabled:opacity-40",
                  )}
                  aria-label={t("map.pin.open")}
                  title={t("map.pin.open")}
                  disabled={!location}
                  onClick={openCity}
                >
                  <ExternalLink
                    className="h-2.5 w-2.5"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                </button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1">
                  <WeatherIcon
                    condition={current.condition}
                    isDay={current.isDay}
                    size={16}
                  />
                  <span className="text-sm font-semibold tabular-nums">
                    {formatTemp(current.temperature, unit)}
                  </span>
                </div>
                <span className="shrink-0 text-[0.65rem] tabular-nums text-[var(--text-muted)]">
                  {formatLocalClock(timezone, locale)}
                </span>
              </div>
            </div>
          ) : loading ? null : (
            <p className="text-[0.7rem] text-[var(--text-secondary)]">
              {t("map.pin.error")}
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
