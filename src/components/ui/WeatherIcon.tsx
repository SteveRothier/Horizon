"use client";

import type { WeatherCondition } from "@/types/weather";
import { cn } from "@/utils/cn";
import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from "lucide-react";
import { memo } from "react";

type WeatherIconProps = {
  condition: WeatherCondition;
  isDay?: boolean;
  className?: string;
  size?: number;
};

export const WeatherIcon = memo(function WeatherIcon({
  condition,
  isDay = true,
  className,
  size = 28,
}: WeatherIconProps) {
  const props = {
    size,
    className: cn("shrink-0 drop-shadow-sm", className),
    "aria-hidden": true as const,
  };

  switch (condition) {
    case "clear":
      return isDay ? (
        <Sun {...props} className={cn(props.className, "text-amber-200")} />
      ) : (
        <Moon {...props} className={cn(props.className, "text-slate-100")} />
      );
    case "partly":
      return isDay ? (
        <CloudSun {...props} className={cn(props.className, "text-amber-100")} />
      ) : (
        <CloudMoon {...props} className={cn(props.className, "text-slate-100")} />
      );
    case "cloudy":
      return <Cloud {...props} className={cn(props.className, "text-white/90")} />;
    case "rain":
      return (
        <CloudRain {...props} className={cn(props.className, "text-sky-200")} />
      );
    case "storm":
      return (
        <CloudLightning
          {...props}
          className={cn(props.className, "text-violet-200")}
        />
      );
    case "snow":
      return (
        <CloudSnow {...props} className={cn(props.className, "text-cyan-50")} />
      );
    case "fog":
      return (
        <CloudFog {...props} className={cn(props.className, "text-white/70")} />
      );
    default:
      return <Cloud {...props} />;
  }
});
