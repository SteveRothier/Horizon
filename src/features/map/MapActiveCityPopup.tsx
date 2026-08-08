"use client";

import { Popup } from "react-leaflet";
import { WeatherIcon } from "@/components/ui/WeatherIcon";
import { useWeather } from "@/hooks/useWeather";
import { useLocale } from "@/hooks/useT";
import { useSettingsStore } from "@/stores/settingsStore";
import type { GeoLocation } from "@/types/weather";
import { formatLocalClock } from "@/utils/format";
import { formatTemp } from "@/utils/units";

type MapActiveCityPopupProps = {
  location: GeoLocation;
};

/** Weather popup for the active Horizon pin (same compact layout as click preview). */
export function MapActiveCityPopup({ location }: MapActiveCityPopupProps) {
  const locale = useLocale();
  const unit = useSettingsStore((s) => s.temperatureUnit);
  const weather = useWeather(
    { lat: location.latitude, lon: location.longitude },
    true,
  );
  const current = weather.data?.current;
  const timezone = weather.data?.timezone;

  return (
    <Popup className="map-weather-popup" closeButton={false} maxWidth={150}>
      <div className="map-weather-popup-inner w-[150px] max-w-[150px] text-[var(--text-primary)] leading-none">
        {current ? (
          <div className="flex flex-col gap-0.5">
            <p className="min-w-0 line-clamp-2 text-[0.8rem] font-semibold leading-snug">
              {location.name}
            </p>
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1">
                <WeatherIcon
                  condition={current.condition}
                  isDay={current.isDay}
                  size={16}
                />
                <span className="text-sm font-semibold tabular-nums">
                  {formatTemp(current.temperature, unit)}
                </span>
              </div>
              <span className="shrink-0 text-[0.65rem] tabular-nums text-[var(--text-muted)]">
                {formatLocalClock(timezone, locale)}
              </span>
            </div>
          </div>
        ) : (
          <p className="line-clamp-2 text-[0.8rem] font-semibold leading-snug">
            {location.name}
          </p>
        )}
      </div>
    </Popup>
  );
}
