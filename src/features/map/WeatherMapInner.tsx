"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { GlassCard } from "@/components/ui/GlassCard";
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
  const { latitude: lat, longitude: lon, name, displayName } = location;

  return (
    <GlassCard
      interactive={false}
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden p-0",
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
          scrollWheelZoom={false}
          className="h-full min-h-[10rem] w-full [&_.leaflet-control-attribution]:text-[0.55rem]"
          style={{ background: "transparent" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Recenter lat={lat} lon={lon} />
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
  );
}
