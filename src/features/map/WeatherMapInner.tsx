"use client";

import { useCallback, useEffect, useState } from "react";
import L from "leaflet";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useReducedMotion,
} from "framer-motion";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { GlassCard } from "@/components/ui/GlassCard";
import { MapControls } from "@/features/map/MapControls";
import { MapResize } from "@/features/map/MapResize";
import { useT } from "@/hooks/useT";
import type { GeoLocation } from "@/types/weather";
import { cn } from "@/utils/cn";
import "leaflet/dist/leaflet.css";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const ease = [0.22, 1, 0.36, 1] as const;

function Recenter({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lon], Math.max(map.getZoom(), 10), { animate: true });
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
  const reduceMotion = useReducedMotion();
  const expandControls = useAnimationControls();
  const { latitude: lat, longitude: lon, name, displayName } = location;
  const [expanded, setExpanded] = useState(false);
  const [resizeTick, setResizeTick] = useState(0);

  const collapse = useCallback(async () => {
    if (!reduceMotion) {
      await expandControls.start({
        opacity: 0.8,
        scale: 0.96,
        transition: { duration: 0.22, ease },
      });
    }
    setExpanded(false);
    expandControls.set({ opacity: 1, scale: 1 });
    setResizeTick((n) => n + 1);
  }, [expandControls, reduceMotion]);

  const expand = useCallback(async () => {
    setExpanded(true);
    if (reduceMotion) {
      setResizeTick((n) => n + 1);
      return;
    }
    await expandControls.start({
      opacity: 0.75,
      scale: 0.96,
      transition: { duration: 0 },
    });
    await expandControls.start({
      opacity: 1,
      scale: 1,
      transition: { duration: 0.32, ease },
    });
    setResizeTick((n) => n + 1);
  }, [expandControls, reduceMotion]);

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
    if (expanded) void collapse();
    else void expand();
  }

  return (
    <>
      <AnimatePresence>
        {expanded ? (
          <motion.button
            key="map-backdrop"
            type="button"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.28, ease }}
            className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm"
            aria-label={t("map.collapse")}
            onClick={() => void collapse()}
          />
        ) : null}
      </AnimatePresence>

      {expanded ? (
        <div className="h-full min-h-[10rem]" aria-hidden />
      ) : null}

      <motion.div
        animate={expandControls}
        initial={{ opacity: 1, scale: 1 }}
        className={cn(
          expanded
            ? "fixed inset-3 z-[60] sm:inset-5 md:inset-8 lg:inset-10 xl:inset-12"
            : "relative h-full min-h-0",
        )}
        style={{ transformOrigin: "top right" }}
      >
        <GlassCard
          interactive={false}
          animate={false}
          id="weather-map"
          tabIndex={-1}
          className={cn(
            "flex h-full min-h-0 flex-col overflow-hidden p-0 outline-none",
            className,
          )}
        >
          <div
            className="relative min-h-[10rem] flex-1 overflow-hidden rounded-[inherit]"
            role="img"
            aria-label={t("map.label", { name })}
          >
            <MapContainer
              center={[lat, lon]}
              zoom={10}
              zoomControl={false}
              scrollWheelZoom
              touchZoom
              doubleClickZoom
              className="h-full min-h-[10rem] w-full [&_.leaflet-control-attribution]:text-[0.55rem]"
              style={{ background: "transparent" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Recenter lat={lat} lon={lon} />
              <MapResize expanded={expanded} resizeTick={resizeTick} />
              <MapControls
                expanded={expanded}
                onToggleExpand={toggleExpand}
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
      </motion.div>
    </>
  );
}
