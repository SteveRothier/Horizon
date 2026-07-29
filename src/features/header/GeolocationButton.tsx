"use client";

import { useState } from "react";
import { LoaderCircle, MapPin } from "lucide-react";
import { useT } from "@/hooks/useT";
import { clientFetchJson } from "@/services/client-api";
import type { GeoLocation } from "@/types/weather";
import { AppApiError } from "@/types/api";
import { cn } from "@/utils/cn";
import { selectLocation } from "@/utils/selectLocation";

type GeocodeReverseResponse = { location: GeoLocation };

type GeolocationButtonProps = {
  className?: string;
  onError?: (message: string) => void;
};

export function GeolocationButton({
  className,
  onError,
}: GeolocationButtonProps) {
  const t = useT();
  const [loading, setLoading] = useState(false);

  async function locate() {
    if (!navigator.geolocation) {
      onError?.(t("geo.unsupported"));
      return;
    }

    setLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 12_000,
            maximumAge: 60_000,
          });
        },
      );

      const { latitude, longitude } = position.coords;
      const data = await clientFetchJson<GeocodeReverseResponse>(
        `/api/geocode?lat=${latitude}&lon=${longitude}`,
      );
      selectLocation(data.location);
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        if (err.code === err.PERMISSION_DENIED) {
          onError?.(t("geo.denied"));
        } else if (err.code === err.TIMEOUT) {
          onError?.(t("geo.timeout"));
        } else {
          onError?.(t("geo.failed"));
        }
      } else if (err instanceof AppApiError) {
        onError?.(err.message);
      } else {
        onError?.(t("geo.failed"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={locate}
      disabled={loading}
      className={cn(
        "glass glass-sm flex h-9 w-9 shrink-0 items-center justify-center",
        "disabled:opacity-60",
        className,
      )}
      aria-label={t("header.geolocate")}
      title={t("header.geolocate")}
    >
      {loading ? (
        <LoaderCircle
          className="h-4 w-4 search-spinner"
          aria-hidden
        />
      ) : (
        <MapPin className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
