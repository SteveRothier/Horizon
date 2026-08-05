"use client";

import { useState } from "react";
import { LoaderCircle, MapPin } from "lucide-react";
import { useFetchReverseGeocode } from "@/hooks/useGeocode";
import { useT } from "@/hooks/useT";
import { AppApiError } from "@/types/api";
import { cn } from "@/utils/cn";
import { selectLocation } from "@/utils/selectLocation";

type GeolocationButtonProps = {
  className?: string;
  onError?: (message: string) => void;
  onSuccess?: () => void;
};

function isGeolocationError(
  err: unknown,
): err is { code: number; PERMISSION_DENIED?: number; TIMEOUT?: number } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "number"
  );
}

export function GeolocationButton({
  className,
  onError,
  onSuccess,
}: GeolocationButtonProps) {
  const t = useT();
  const fetchReverse = useFetchReverseGeocode();
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
            timeout: 20_000,
            maximumAge: 120_000,
          });
        },
      );

      const { latitude, longitude } = position.coords;
      const location = await fetchReverse(latitude, longitude);
      selectLocation(location);
      onSuccess?.();
    } catch (err) {
      if (isGeolocationError(err)) {
        // W3C codes — avoid instanceof (unreliable on Safari)
        if (err.code === 1) {
          onError?.(t("geo.denied"));
        } else if (err.code === 3) {
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
        <LoaderCircle className="h-4 w-4 search-spinner" aria-hidden />
      ) : (
        <MapPin className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
