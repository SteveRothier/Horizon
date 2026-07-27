"use client";

import dynamic from "next/dynamic";
import { MapSkeleton } from "@/components/ui/skeletons";
import type { GeoLocation } from "@/types/weather";

const WeatherMapInner = dynamic(() => import("./WeatherMapInner"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

type WeatherMapProps = {
  location: GeoLocation;
  className?: string;
};

export function WeatherMap({ location, className }: WeatherMapProps) {
  return <WeatherMapInner location={location} className={className} />;
}
