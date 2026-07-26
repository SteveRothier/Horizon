"use client";

import { useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { clientFetchJson } from "@/services/client-api";
import { useLocationStore } from "@/stores/locationStore";
import type { GeoLocation } from "@/types/weather";
import { AppApiError } from "@/types/api";
import { cn } from "@/utils/cn";

type GeocodeReverseResponse = { location: GeoLocation };

type GeolocationButtonProps = {
  className?: string;
  onError?: (message: string) => void;
};

export function GeolocationButton({
  className,
  onError,
}: GeolocationButtonProps) {
  const setLocation = useLocationStore((s) => s.setLocation);
  const [loading, setLoading] = useState(false);

  async function locate() {
    if (!navigator.geolocation) {
      onError?.("La géolocalisation n’est pas supportée.");
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
      setLocation(data.location);
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        if (err.code === err.PERMISSION_DENIED) {
          onError?.("Géolocalisation refusée. Autorisez l’accès à la position.");
        } else if (err.code === err.TIMEOUT) {
          onError?.("Délai de géolocalisation dépassé.");
        } else {
          onError?.("Impossible d’obtenir votre position.");
        }
      } else if (err instanceof AppApiError) {
        onError?.(err.message);
      } else {
        onError?.("Impossible d’obtenir votre position.");
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
        "glass glass-sm flex h-9 w-9 shrink-0 items-center justify-center sm:h-10 sm:w-10",
        "disabled:opacity-60",
        className,
      )}
      aria-label="Utiliser ma position"
      title="Utiliser ma position"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <MapPin className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
