"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import L from "leaflet";
import {
  AttributionControl,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { GlassCard } from "@/components/ui/GlassCard";
import { MapControls } from "@/features/map/MapControls";
import { MapResize } from "@/features/map/MapResize";
import { flyToSafe } from "@/features/map/flyToSafe";
import {
  OSM_BASE_ATTRIBUTION,
  OSM_BASE_URL,
} from "@/features/map/map-layers";
import { useT } from "@/hooks/useT";
import type { GeoLocation } from "@/types/weather";
import { cn } from "@/utils/cn";
import { coordsFromLocation } from "@/utils/location-match";
import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconUrl: "/leaflet/marker-icon.png",
  iconRetinaUrl: "/leaflet/marker-icon-2x.png",
  shadowUrl: "/leaflet/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const EXPAND_MS = 520;
const EXPAND_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

type Rect = { top: number; left: number; width: number; height: number };

function readRect(el: HTMLElement): Rect {
  const r = el.getBoundingClientRect();
  return {
    top: r.top,
    left: r.left,
    width: Math.max(r.width, 1),
    height: Math.max(r.height, 1),
  };
}

/** Mirrors inset-3 / sm:inset-5 / md:inset-8 / lg:inset-10 / xl:inset-12 */
function expandedRect(): Rect {
  const w = window.innerWidth;
  const h = window.innerHeight;
  let pad = 12;
  if (w >= 1280) pad = 48;
  else if (w >= 1024) pad = 40;
  else if (w >= 768) pad = 32;
  else if (w >= 640) pad = 20;
  return { top: pad, left: pad, width: w - pad * 2, height: h - pad * 2 };
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

const FALLBACK_LAT = 48.8566;
const FALLBACK_LON = 2.3522;

function Recenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  const prevRef = useRef<{ lat: number; lon: number } | null>(null);
  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const prev = prevRef.current;
    if (
      prev &&
      Math.abs(prev.lat - lat) < 1e-6 &&
      Math.abs(prev.lon - lon) < 1e-6
    ) {
      return;
    }
    prevRef.current = { lat, lon };
    flyToSafe(map, lat, lon, { duration: 0.55 });
  }, [lat, lon, map]);
  return null;
}

type WeatherMapProps = {
  location: GeoLocation;
  className?: string;
};

export default function WeatherMapInner({
  location,
  className,
}: WeatherMapProps) {
  const t = useT();
  const coords = coordsFromLocation(location);
  const lat = coords?.lat ?? FALLBACK_LAT;
  const lon = coords?.lon ?? FALLBACK_LON;
  const { name, displayName } = location;
  const [expanded, setExpanded] = useState(false);
  const [resizeTick, setResizeTick] = useState(0);
  const [slotRect, setSlotRect] = useState<Rect | null>(null);
  const [shellRect, setShellRect] = useState<Rect | null>(null);
  const [animating, setAnimating] = useState(false);
  const [backdropOn, setBackdropOn] = useState(false);

  const slotRef = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const animTimerRef = useRef(0);

  const measureSlot = useCallback(() => {
    const el = slotRef.current;
    if (!el) return;
    setSlotRect(readRect(el));
  }, []);

  useLayoutEffect(() => {
    measureSlot();
  }, [measureSlot]);

  useEffect(() => {
    return () => {
      if (animTimerRef.current) window.clearTimeout(animTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const el = slotRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measureSlot());
    ro.observe(el);
    window.addEventListener("resize", measureSlot);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measureSlot);
    };
  }, [measureSlot]);

  const bumpResize = useCallback(() => {
    setResizeTick((n) => n + 1);
  }, []);

  const expand = useCallback(async () => {
    if (busyRef.current || expanded) return;
    const from = slotRef.current ? readRect(slotRef.current) : slotRect;
    if (!from) {
      setExpanded(true);
      setBackdropOn(true);
      setShellRect(expandedRect());
      bumpResize();
      return;
    }

    busyRef.current = true;
    setAnimating(true);
    setExpanded(true);
    setBackdropOn(false);
    setShellRect(from);
    await nextFrame();
    setBackdropOn(true);
    setShellRect(expandedRect());
    if (animTimerRef.current) window.clearTimeout(animTimerRef.current);
    animTimerRef.current = window.setTimeout(() => {
      animTimerRef.current = 0;
      setAnimating(false);
      busyRef.current = false;
      bumpResize();
    }, EXPAND_MS + 40);
  }, [bumpResize, expanded, slotRect]);

  const collapse = useCallback(async () => {
    if (busyRef.current || !expanded) return;
    const to = slotRef.current ? readRect(slotRef.current) : slotRect;

    if (!to) {
      setExpanded(false);
      setBackdropOn(false);
      setAnimating(false);
      setShellRect(null);
      bumpResize();
      return;
    }

    busyRef.current = true;
    setAnimating(true);
    setBackdropOn(false);
    setShellRect(shellRect ?? expandedRect());
    await nextFrame();
    setShellRect(to);
    if (animTimerRef.current) window.clearTimeout(animTimerRef.current);
    animTimerRef.current = window.setTimeout(() => {
      animTimerRef.current = 0;
      setExpanded(false);
      setAnimating(false);
      busyRef.current = false;
      setShellRect(null);
      bumpResize();
    }, EXPAND_MS + 40);
  }, [bumpResize, expanded, shellRect, slotRect]);

  useEffect(() => {
    if (!expanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        void collapse();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded, collapse]);

  function toggleExpand() {
    if (busyRef.current) return;
    if (expanded) void collapse();
    else void expand();
  }

  const flying = expanded || animating;
  const rect = shellRect ?? slotRect;

  return (
    <div ref={slotRef} className="relative h-full min-h-[10rem] w-full">
      {/* Same stacking context as shell — avoids backdrop covering/blurring the map. */}
      {flying ? (
        <button
          type="button"
          className={cn(
            "map-backdrop-fly fixed inset-0 z-[55] border-0 bg-black/55",
            backdropOn ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          style={{
            transition: `opacity ${EXPAND_MS}ms ${EXPAND_EASE}`,
          }}
          aria-label={t("map.collapse")}
          onClick={() => void collapse()}
        />
      ) : null}

      <div
        className={cn(
          "overflow-hidden rounded-[var(--glass-radius)]",
          "shadow-[var(--glass-shadow)]",
          flying ? "fixed z-[60]" : "absolute inset-0 z-0",
          animating && "map-shell-fly",
        )}
        style={
          flying && rect
            ? {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                transition: animating
                  ? `top ${EXPAND_MS}ms ${EXPAND_EASE}, left ${EXPAND_MS}ms ${EXPAND_EASE}, width ${EXPAND_MS}ms ${EXPAND_EASE}, height ${EXPAND_MS}ms ${EXPAND_EASE}`
                  : "none",
                willChange: animating ? "top, left, width, height" : undefined,
              }
            : undefined
        }
      >
        <GlassCard
          interactive={false}
          animate={false}
          id="weather-map"
          tabIndex={-1}
          className={cn(
            "flex h-full min-h-0 flex-col overflow-hidden p-0 outline-none !shadow-none",
            flying &&
              "![backdrop-filter:none] ![-webkit-backdrop-filter:none] bg-[rgba(12,18,28,0.97)]",
            className,
          )}
        >
          <div
            className="relative h-full min-h-0 w-full flex-1 overflow-hidden rounded-[inherit]"
            role="img"
            aria-label={t("map.label", { name })}
          >
            <MapContainer
              center={[lat, lon]}
              zoom={10}
              zoomControl={false}
              attributionControl={false}
              scrollWheelZoom
              touchZoom
              doubleClickZoom={false}
              zoomAnimation
              fadeAnimation={false}
              markerZoomAnimation={false}
              className="h-full min-h-0 w-full [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full [&_.leaflet-control-attribution]:text-[0.55rem] [&_.leaflet-control-attribution]:bg-black/40 [&_.leaflet-control-attribution]:text-white/80"
              style={{ background: "transparent" }}
            >
              <AttributionControl position="bottomright" />
              <TileLayer
                attribution={OSM_BASE_ATTRIBUTION}
                url={OSM_BASE_URL}
              />
              <Recenter lat={lat} lon={lon} />
              <MapResize
                expanded={expanded}
                resizeTick={resizeTick}
                animating={animating}
              />
              <MapControls
                expanded={expanded}
                onToggleExpand={toggleExpand}
                lat={lat}
                lon={lon}
              />
              <Marker position={[lat, lon]} icon={markerIcon}>
                <Popup>
                  <strong>{name}</strong>
                  <br />
                  <span className="text-xs">{displayName}</span>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
