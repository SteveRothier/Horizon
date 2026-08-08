"use client";

import { useState } from "react";
import { LoaderCircle, MapPin } from "lucide-react";
import { useFetchReverseGeocode } from "@/hooks/useGeocode";
import { useT } from "@/hooks/useT";
import { AppApiError } from "@/types/api";
import { cn } from "@/utils/cn";
import {
  isGeolocationError,
  locateUserPosition,
} from "@/utils/locate-user";
import { selectLocation } from "@/utils/selectLocation";

type GeolocationButtonProps = {
  className?: string;
  onError?: (message: string) => void;
  onSuccess?: () => void;
};

export function GeolocationButton({
  className,
  onError,
  onSuccess,
}: GeolocationButtonProps) {
  const t = useT();
  const fetchReverse = useFetchReverseGeocode();
  const [loading, setLoading] = useState(false);

  async function locate() {
    setLoading(true);
    try {
      const location = await locateUserPosition(fetchReverse);
      selectLocation(location);
      onSuccess?.();
    } catch (err) {
      if (isGeolocationError(err)) {
        if (err.code === -1) {
          onError?.(t("geo.unsupported"));
        } else if (err.code === 1) {
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
      onClick={() => void locate()}
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
