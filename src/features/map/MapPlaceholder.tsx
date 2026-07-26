"use client";

import { MapPin } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import type { GeoLocation } from "@/types/weather";
import { cn } from "@/utils/cn";

type MapPlaceholderProps = {
  location: GeoLocation;
  className?: string;
};

/** Placeholder until Leaflet map (phase map-seo) */
export function MapPlaceholder({ location, className }: MapPlaceholderProps) {
  return (
    <GlassCard
      interactive={false}
      className={cn(
        "flex h-full min-h-0 flex-col items-center justify-center gap-2 overflow-hidden p-[var(--card-pad)]",
        className,
      )}
    >
      <MapPin className="h-6 w-6 text-[var(--accent)]" aria-hidden />
      <p className="text-center text-sm font-medium">{location.name}</p>
      <p className="text-center text-[0.65rem] text-[var(--text-muted)]">
        {location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°
      </p>
      <p className="text-center text-[0.65rem] text-[var(--text-muted)]">
        Carte interactive bientôt
      </p>
    </GlassCard>
  );
}
