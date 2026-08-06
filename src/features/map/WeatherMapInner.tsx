"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

const FADE_MS = 240;
const FADE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

const MAP_CLASS =
  "h-full min-h-0 w-full [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full [&_.leaflet-control-attribution]:text-[0.55rem] [&_.leaflet-control-attribution]:bg-black/40 [&_.leaflet-control-attribution]:text-white/80";

function Recenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], Math.max(map.getZoom(), 10), { duration: 0.55 });
  }, [lat, lon, map]);
  return null;
}

type MapBodyProps = {
  lat: number;
  lon: number;
  name: string;
  displayName: string;
  expanded: boolean;
  onToggleExpand: () => void;
  resizeTick?: number;
};

function MapBody({
  lat,
  lon,
  name,
  displayName,
  expanded,
  onToggleExpand,
  resizeTick = 0,
}: MapBodyProps) {
  return (
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
      className={MAP_CLASS}
      style={{ background: "transparent" }}
    >
      <AttributionControl position="bottomright" />
      <TileLayer attribution={OSM_BASE_ATTRIBUTION} url={OSM_BASE_URL} />
      <Recenter lat={lat} lon={lon} />
      <MapResize resizeTick={resizeTick} />
      <MapControls
        expanded={expanded}
        onToggleExpand={onToggleExpand}
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
  );
}

type WeatherMapProps = {
  location: GeoLocation;
  className?: string;
};

/**
 * Collapsed: in-flow map (drag / zoom like before — native scroll layout).
 * Expanded: separate fullscreen portal instance; preview stays untouched.
 */
export default function WeatherMapInner({
  location,
  className,
}: WeatherMapProps) {
  const t = useT();
  const { latitude: lat, longitude: lon, name, displayName } = location;
  const [expanded, setExpanded] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayTick, setOverlayTick] = useState(0);
  const [mounted, setMounted] = useState(false);
  const collapsingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const expand = useCallback(() => {
    if (expanded || collapsingRef.current) return;
    setExpanded(true);
    setOverlayTick((n) => n + 1);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setOverlayVisible(true));
    });
  }, [expanded]);

  const collapse = useCallback(() => {
    if (!expanded || collapsingRef.current) return;
    collapsingRef.current = true;
    setOverlayVisible(false);
    window.setTimeout(() => {
      setExpanded(false);
      collapsingRef.current = false;
    }, FADE_MS);
  }, [expanded]);

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
        collapse();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded, collapse]);

  const mapProps = {
    lat,
    lon,
    name,
    displayName,
  };

  const overlay =
    mounted && expanded
      ? createPortal(
          <div className="pointer-events-none fixed inset-0 z-[60]">
            <button
              type="button"
              className={cn(
                "map-backdrop-fly pointer-events-auto absolute inset-0 border-0 bg-black/55",
                overlayVisible ? "opacity-100" : "opacity-0",
              )}
              style={{
                transition: `opacity ${FADE_MS}ms ${FADE_EASE}`,
              }}
              aria-label={t("map.collapse")}
              onClick={collapse}
            />
            <div
              className={cn(
                "pointer-events-auto absolute inset-3 overflow-hidden rounded-[var(--glass-radius)] shadow-[var(--glass-shadow)] sm:inset-5 md:inset-8 lg:inset-10 xl:inset-12",
                overlayVisible ? "opacity-100" : "opacity-0",
              )}
              style={{
                transition: `opacity ${FADE_MS}ms ${FADE_EASE}`,
              }}
            >
              <GlassCard
                interactive={false}
                animate={false}
                className={cn(
                  "flex h-full min-h-0 flex-col overflow-hidden p-0 outline-none !shadow-none",
                  "![backdrop-filter:none] ![-webkit-backdrop-filter:none] bg-[rgba(12,18,28,0.97)]",
                )}
              >
                <div
                  className="relative h-full min-h-0 w-full flex-1 overflow-hidden rounded-[inherit]"
                  role="img"
                  aria-label={t("map.label", { name })}
                >
                  <MapBody
                    {...mapProps}
                    expanded
                    onToggleExpand={collapse}
                    resizeTick={overlayTick}
                  />
                </div>
              </GlassCard>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div className="relative h-full min-h-[10rem] w-full">
        <div
          className={cn(
            "h-full w-full overflow-hidden rounded-[var(--glass-radius)]",
            "shadow-[var(--glass-shadow)]",
          )}
        >
          <GlassCard
            interactive={false}
            animate={false}
            id="weather-map"
            tabIndex={-1}
            className={cn(
              "flex h-full min-h-0 flex-col overflow-hidden p-0 outline-none !shadow-none",
              className,
            )}
          >
            <div
              className="relative h-full min-h-0 w-full flex-1 overflow-hidden rounded-[inherit]"
              role="img"
              aria-label={t("map.label", { name })}
            >
              <MapBody
                {...mapProps}
                expanded={false}
                onToggleExpand={expand}
              />
            </div>
          </GlassCard>
        </div>
      </div>
      {overlay}
    </>
  );
}
