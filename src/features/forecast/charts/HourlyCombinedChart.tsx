"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { WeatherIcon } from "@/components/ui/WeatherIcon";
import { useGrabScroll } from "@/hooks/useGrabScroll";
import { useLocale } from "@/hooks/useT";
import { useSettingsStore } from "@/stores/settingsStore";
import type { HourlyForecastItem } from "@/types/weather";
import { formatHour } from "@/utils/format";
import { tempStrokeColor } from "@/utils/temp-color";
import { toDisplaySpeed, toDisplayTemp } from "@/utils/units";
import { cn } from "@/utils/cn";

export const HOURLY_COL_WIDTH = 56;

const CHART_HEIGHT = 96;
const CHART_TOP = 20;
const CHART_BOTTOM = 8;

type HourlyCombinedChartProps = {
  items: HourlyForecastItem[];
  className?: string;
};

type PlotPoint = { x: number; y: number; value: number };

function buildSmoothPath(points: PlotPoint[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

function buildAreaPath(points: PlotPoint[], baseline: number): string {
  if (points.length === 0) return "";
  const line = buildSmoothPath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`;
}

function sampleCurveSegment(
  from: PlotPoint,
  to: PlotPoint,
  steps: number,
): PlotPoint[] {
  const cx = (from.x + to.x) / 2;
  const samples: PlotPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const x =
      mt * mt * mt * from.x +
      3 * mt * mt * t * cx +
      3 * mt * t * t * cx +
      t * t * t * to.x;
    const y =
      mt * mt * mt * from.y +
      3 * mt * mt * t * from.y +
      3 * mt * t * t * to.y +
      t * t * t * to.y;
    const value = from.value + (to.value - from.value) * t;
    samples.push({ x, y, value });
  }
  return samples;
}

function renderCurveSegments(
  points: PlotPoint[],
  keyPrefix: string,
  strokeForSegment: (a: PlotPoint, b: PlotPoint) => string,
  strokeWidth: number,
): ReactNode[] {
  return points.slice(1).flatMap((point, index) => {
    const prev = points[index];
    const segSamples = sampleCurveSegment(prev, point, 6);
    const segments: ReactNode[] = [];
    for (let i = 1; i < segSamples.length; i++) {
      const a = segSamples[i - 1];
      const b = segSamples[i];
      segments.push(
        <line
          key={`${keyPrefix}-${index}-${i}`}
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          stroke={strokeForSegment(a, b)}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />,
      );
    }
    return segments;
  });
}

export function HourlyCombinedChart({
  items,
  className,
}: HourlyCombinedChartProps) {
  const locale = useLocale();
  const temperatureUnit = useSettingsStore((s) => s.temperatureUnit);
  const speedUnit = useSettingsStore((s) => s.speedUnit);
  const { ref: scrollRef, grabbing } = useGrabScroll<HTMLDivElement>();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const hourly = useMemo(() => items.slice(0, 24), [items]);
  const contentWidth = Math.max(hourly.length, 1) * HOURLY_COL_WIDTH;

  const { tempPoints, precipPoints, domainMin, domainMax, baseline } =
    useMemo(() => {
      const temps = hourly.map((item) =>
        Math.round(toDisplayTemp(item.temperature, temperatureUnit)),
      );
      const minTemp = Math.min(...temps);
      const maxTemp = Math.max(...temps);
      const pad = Math.max(2, Math.round((maxTemp - minTemp) * 0.15) || 2);
      const domainMin = minTemp - pad;
      const domainMax = maxTemp + pad;
      const plotHeight = CHART_HEIGHT - CHART_TOP - CHART_BOTTOM;
      const baseline = CHART_HEIGHT - CHART_BOTTOM;

      const tempPoints: PlotPoint[] = hourly.map((item, index) => {
        const temp = Math.round(
          toDisplayTemp(item.temperature, temperatureUnit),
        );
        const ratio = (temp - domainMin) / (domainMax - domainMin || 1);
        return {
          x: index * HOURLY_COL_WIDTH + HOURLY_COL_WIDTH / 2,
          y: CHART_TOP + plotHeight * (1 - ratio),
          value: temp,
        };
      });

      const precipValues = hourly.map((item) =>
        Math.round(item.precipitationProbability),
      );
      const precipMax = Math.max(10, ...precipValues);

      const precipPoints: PlotPoint[] = hourly.map((item, index) => {
        const precip = Math.round(item.precipitationProbability);
        const ratio = precip / precipMax;
        return {
          x: index * HOURLY_COL_WIDTH + HOURLY_COL_WIDTH / 2,
          y: CHART_TOP + plotHeight * (1 - ratio),
          value: precip,
        };
      });

      return { tempPoints, precipPoints, domainMin, domainMax, baseline };
    }, [hourly, temperatureUnit]);

  const precipAreaPath = useMemo(
    () => buildAreaPath(precipPoints, baseline),
    [precipPoints, baseline],
  );
  const tempAreaPath = useMemo(
    () => buildAreaPath(tempPoints, baseline),
    [tempPoints, baseline],
  );
  const speedFormatter = new Intl.NumberFormat(
    locale === "fr" ? "fr-FR" : "en-US",
    { minimumFractionDigits: 1, maximumFractionDigits: 1 },
  );
  const speedSuffix = speedUnit === "mph" ? "mph" : "km/h";

  const updateActiveIndex = useCallback(
    (clientX: number, clientY: number) => {
      if (grabbing) {
        setActiveIndex(null);
        return;
      }

      const scrollEl = scrollRef.current;
      if (!scrollEl) return;

      const rect = scrollEl.getBoundingClientRect();
      const localY = clientY - rect.top;
      if (localY < 0 || localY > CHART_HEIGHT) {
        setActiveIndex(null);
        return;
      }

      const x = clientX - rect.left + scrollEl.scrollLeft;
      const index = Math.floor(x / HOURLY_COL_WIDTH);
      if (index >= 0 && index < hourly.length) {
        setActiveIndex(index);
      } else {
        setActiveIndex(null);
      }
    },
    [grabbing, hourly.length, scrollRef],
  );

  const activeTemp =
    activeIndex != null ? tempPoints[activeIndex]?.value : null;
  const activePrecip =
    activeIndex != null ? precipPoints[activeIndex]?.value : null;
  const tooltipLeft =
    activeIndex != null
      ? activeIndex * HOURLY_COL_WIDTH + HOURLY_COL_WIDTH / 2
      : 0;

  const pointsRef = useRef({ tempPoints, precipPoints });
  pointsRef.current = { tempPoints, precipPoints };

  const syncTooltipPos = useCallback(() => {
    if (activeIndex == null || grabbing) {
      setTooltipPos((prev) => (prev == null ? prev : null));
      return;
    }

    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const { tempPoints: tempsPts, precipPoints: precipPts } = pointsRef.current;
    const rect = scrollEl.getBoundingClientRect();
    const chartY = Math.min(
      tempsPts[activeIndex]?.y ?? CHART_TOP,
      precipPts[activeIndex]?.y ?? CHART_TOP,
    );
    const next = {
      left:
        rect.left +
        activeIndex * HOURLY_COL_WIDTH +
        HOURLY_COL_WIDTH / 2 -
        scrollEl.scrollLeft,
      top: rect.top + chartY - 8,
    };

    setTooltipPos((prev) => {
      if (
        prev &&
        Math.abs(prev.left - next.left) < 0.5 &&
        Math.abs(prev.top - next.top) < 0.5
      ) {
        return prev;
      }
      return next;
    });
  }, [activeIndex, grabbing, scrollRef]);

  useLayoutEffect(() => {
    syncTooltipPos();
  }, [syncTooltipPos]);

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || activeIndex == null) return;

    scrollEl.addEventListener("scroll", syncTooltipPos, { passive: true });
    window.addEventListener("resize", syncTooltipPos);

    return () => {
      scrollEl.removeEventListener("scroll", syncTooltipPos);
      window.removeEventListener("resize", syncTooltipPos);
    };
  }, [activeIndex, scrollRef, syncTooltipPos]);

  return (
    <div className={cn("min-h-0 flex-1", className)}>
      <div
        ref={scrollRef}
        className={cn(
          "hourly-chart-scroll scrollbar-none overflow-x-auto",
          grabbing && "is-grabbing",
        )}
        onPointerMove={(event) =>
          updateActiveIndex(event.clientX, event.clientY)
        }
        onPointerLeave={() => setActiveIndex(null)}
      >
        <div className="pb-0.5" style={{ width: contentWidth }}>
          <div className="relative" style={{ height: CHART_HEIGHT }}>
            <svg
              width={contentWidth}
              height={CHART_HEIGHT}
              className="block overflow-visible"
              aria-hidden
            >
              <defs>
                <linearGradient
                  id="hourlyPrecipFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="rgba(110, 200, 255, 0.22)" />
                  <stop offset="100%" stopColor="rgba(110, 200, 255, 0.02)" />
                </linearGradient>
                <linearGradient
                  id="hourlyCombinedFill"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="rgba(255, 255, 255, 0.22)" />
                  <stop offset="100%" stopColor="rgba(255, 255, 255, 0.02)" />
                </linearGradient>
              </defs>
              {precipAreaPath ? (
                <path d={precipAreaPath} fill="url(#hourlyPrecipFill)" />
              ) : null}
              {renderCurveSegments(
                precipPoints,
                "precip",
                () => "var(--accent-cool)",
                2,
              )}
              {tempAreaPath ? (
                <path d={tempAreaPath} fill="url(#hourlyCombinedFill)" />
              ) : null}
              {renderCurveSegments(
                tempPoints,
                "temp",
                (a, b) =>
                  tempStrokeColor(
                    (a.value + b.value) / 2,
                    domainMin,
                    domainMax,
                  ),
                2.75,
              )}
              {activeIndex != null && !grabbing ? (
                <line
                  x1={tooltipLeft}
                  y1={CHART_TOP}
                  x2={tooltipLeft}
                  y2={baseline}
                  stroke="rgba(255, 255, 255, 0.28)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
              ) : null}
              {tempPoints.map((point, index) =>
                activeIndex === index ? null : (
                  <text
                    key={`label-${point.x}`}
                    x={point.x}
                    y={point.y - 10}
                    textAnchor="middle"
                    fill="var(--text-secondary)"
                    fontSize={11}
                    fontWeight={500}
                  >
                    {point.value}°
                  </text>
                ),
              )}
            </svg>
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${Math.max(hourly.length, 1)}, ${HOURLY_COL_WIDTH}px)`,
            }}
          >
            {hourly.map((item) => (
              <div
                key={`icon-${item.time}`}
                className="flex items-center justify-center py-0.5"
              >
                <WeatherIcon
                  condition={item.condition}
                  isDay={item.isDay}
                  size={20}
                />
              </div>
            ))}
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${Math.max(hourly.length, 1)}, ${HOURLY_COL_WIDTH}px)`,
            }}
          >
            {hourly.map((item) => {
              const speed = toDisplaySpeed(item.windSpeed, speedUnit);
              return (
                <div
                  key={`wind-${item.time}`}
                  className="flex items-center justify-center py-0.5 text-center text-[0.65rem] text-[var(--text-primary)] sm:text-xs"
                >
                  {speedFormatter.format(speed)} {speedSuffix}
                </div>
              );
            })}
          </div>

          <div
            className="grid pt-0.5"
            style={{
              gridTemplateColumns: `repeat(${Math.max(hourly.length, 1)}, ${HOURLY_COL_WIDTH}px)`,
            }}
          >
            {hourly.map((item) => (
              <div
                key={`time-${item.time}`}
                className="truncate px-0.5 text-center text-[0.65rem] text-[var(--text-muted)] sm:text-xs"
              >
                {formatHour(item.time, locale)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {mounted &&
        tooltipPos &&
        activeTemp != null &&
        createPortal(
          <div
            className="glass-menu-tip pointer-events-none fixed z-[200] -translate-x-1/2 -translate-y-full whitespace-nowrap px-2.5 py-1 text-[0.65rem] font-medium sm:text-xs"
            style={{ left: tooltipPos.left, top: tooltipPos.top, marginTop: -6 }}
            role="status"
            aria-live="polite"
          >
            <span className="text-[var(--text-primary)]">{activeTemp}°</span>
            <span className="text-[var(--text-muted)]"> · </span>
            <span className="text-[var(--accent-cool)]">{activePrecip}%</span>
          </div>,
          document.body,
        )}
    </div>
  );
}
