"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import {
  OSM_BASE_ATTRIBUTION,
  OSM_BASE_URL,
} from "@/features/map/map-layers";
import { useT } from "@/hooks/useT";
import type { GeoLocation } from "@/types/weather";
import { cn } from "@/utils/cn";
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

function applyShellRectDom(el: HTMLElement, rect: Rect) {
  el.style.top = `${rect.top}px`;
  el.style.left = `${rect.left}px`;
  el.style.width = `${rect.width}px`;
  el.style.height = `${rect.height}px`;
}

function Recenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], Math.max(map.getZoom(), 10), { duration: 0.55 });
  }, [lat, lon, map]);
  return null;
}

type WeatherMapProps = {
  location: GeoLocation;
  className?: string;
};

/**
 * Always portal + fixed. Collapsed position follows the slot via rAF DOM
 * writes (no React setState on scroll) to avoid compositor lag / jiggle.
 * Expand/collapse still uses React state for CSS transitions.
 */
export default function WeatherMapInner({
  location,
  className,
}: WeatherMapProps) {
  const t = useT();
  const { latitude: lat, longitude: lon, name, displayName } = location;
  const [expanded, setExpanded] = useState(false);
  const [resizeTick, setResizeTick] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [shellReady, setShellReady] = useState(false);
  const [shellRect, setShellRect] = useState<Rect | null>(null);
  const [animating, setAnimating] = useState(false);
  const [backdropOn, setBackdropOn] = useState(false);

  const slotRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const slotRectRef = useRef<Rect | null>(null);
  const busyRef = useRef(false);
  const flyingRef = useRef(false);
  const rafRef = useRef(0);

  const flying = expanded || animating;
  flyingRef.current = flying;

  useEffect(() => {
    setMounted(true);
  }, []);

  const syncShellToSlot = useCallback(() => {
    const slot = slotRef.current;
    const shell = shellRef.current;
    if (!slot || !shell) return;
    if (flyingRef.current || busyRef.current) return;
    const next = readRect(slot);
    slotRectRef.current = next;
    applyShellRectDom(shell, next);
  }, []);

  const scheduleSync = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      syncShellToSlot();
    });
  }, [syncShellToSlot]);

  useLayoutEffect(() => {
    if (!mounted) return;
    setShellReady(true);
  }, [mounted]);

  // Apply slot rect once the portaled shell exists (and on every collapsed resume).
  useLayoutEffect(() => {
    if (!shellReady || flying) return;
    syncShellToSlot();
  }, [shellReady, flying, syncShellToSlot]);

  useEffect(() => {
    if (!mounted || !shellReady) return;
    const el = slotRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => scheduleSync());
    ro.observe(el);
    window.addEventListener("resize", scheduleSync);
    window.addEventListener("scroll", scheduleSync, true);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      ro.disconnect();
      window.removeEventListener("resize", scheduleSync);
      window.removeEventListener("scroll", scheduleSync, true);
    };
  }, [mounted, shellReady, scheduleSync]);

  const bumpResize = useCallback(() => {
    setResizeTick((n) => n + 1);
  }, []);

  const expand = useCallback(async () => {
    if (busyRef.current || expanded) return;
    const from = slotRef.current
      ? readRect(slotRef.current)
      : slotRectRef.current;
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
    window.setTimeout(() => {
      setAnimating(false);
      busyRef.current = false;
      bumpResize();
    }, EXPAND_MS + 40);
  }, [bumpResize, expanded]);

  const collapse = useCallback(async () => {
    if (busyRef.current || !expanded) return;
    const to = slotRef.current
      ? readRect(slotRef.current)
      : slotRectRef.current;

    if (!to) {
      setExpanded(false);
      setBackdropOn(false);
      setAnimating(false);
      setShellRect(null);
      bumpResize();
      scheduleSync();
      return;
    }

    busyRef.current = true;
    setAnimating(true);
    setBackdropOn(false);
    setShellRect((prev) => prev ?? expandedRect());
    await nextFrame();
    setShellRect(to);
    window.setTimeout(() => {
      setExpanded(false);
      setAnimating(false);
      busyRef.current = false;
      setShellRect(null);
      bumpResize();
      // Resume DOM sync after React releases style ownership.
      requestAnimationFrame(() => scheduleSync());
    }, EXPAND_MS + 40);
  }, [bumpResize, expanded, scheduleSync]);

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

  const mapShell =
    mounted && shellReady ? (
      <>
        {flying && (
          <button
            type="button"
            className={cn(
              "map-backdrop-fly fixed inset-0 z-[55] border-0 bg-black/50 backdrop-blur-sm",
              backdropOn ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            style={{
              transition: `opacity ${EXPAND_MS}ms ${EXPAND_EASE}`,
            }}
            aria-label={t("map.collapse")}
            onClick={() => void collapse()}
          />
        )}

        <div
          ref={shellRef}
          className={cn(
            "pointer-events-auto fixed overflow-hidden rounded-[var(--glass-radius)]",
            "shadow-[var(--glass-shadow)]",
            animating && "map-shell-fly",
          )}
          style={
            flying && shellRect
              ? {
                  top: shellRect.top,
                  left: shellRect.left,
                  width: shellRect.width,
                  height: shellRect.height,
                  zIndex: 60,
                  transition: animating
                    ? `top ${EXPAND_MS}ms ${EXPAND_EASE}, left ${EXPAND_MS}ms ${EXPAND_EASE}, width ${EXPAND_MS}ms ${EXPAND_EASE}, height ${EXPAND_MS}ms ${EXPAND_EASE}`
                    : "none",
                  willChange: animating
                    ? "top, left, width, height"
                    : undefined,
                }
              : {
                  zIndex: 40,
                  transition: "none",
                }
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
              className="relative min-h-0 flex-1 overflow-hidden rounded-[inherit]"
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
                fadeAnimation
                markerZoomAnimation
                className="h-full min-h-[10rem] w-full [&_.leaflet-control-attribution]:text-[0.55rem] [&_.leaflet-control-attribution]:bg-black/40 [&_.leaflet-control-attribution]:text-white/80"
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
      </>
    ) : null;

  return (
    <>
      <div ref={slotRef} className="h-full min-h-[10rem] w-full" aria-hidden />
      {mounted ? createPortal(mapShell, document.body) : null}
    </>
  );
}
