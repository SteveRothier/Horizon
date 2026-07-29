"use client";

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { WeatherIcon } from "@/components/ui/WeatherIcon";
import { useGrabScroll } from "@/hooks/useGrabScroll";
import { useLocale } from "@/hooks/useT";
import {
  useSettingsStore,
  type AppLocale,
  type SpeedUnit,
} from "@/stores/settingsStore";
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
  /** Align this column to the left edge of the viewport. */
  scrollToIndex?: number;
  scrollDurationMs?: number;
  locationId?: string;
  /** Fired while the user (or animation) scrolls — column under the left edge. */
  onScrollColumn?: (columnIndex: number) => void;
  /** Fired when a programmatic scrollToIndex animation finishes (or is skipped). */
  onProgrammaticScrollEnd?: () => void;
  className?: string;
};

function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function animateScrollLeft(
  el: HTMLElement,
  to: number,
  durationMs: number,
  signal: { cancelled: boolean },
  onComplete?: () => void,
) {
  const from = el.scrollLeft;
  const delta = to - from;
  if (durationMs <= 0 || Math.abs(delta) < 0.5) {
    el.scrollLeft = to;
    onComplete?.();
    return;
  }

  const start = performance.now();
  const tick = (now: number) => {
    if (signal.cancelled) return;
    const t = Math.min(1, (now - start) / durationMs);
    el.scrollLeft = from + delta * easeOutExpo(t);
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      onComplete?.();
    }
  };
  requestAnimationFrame(tick);
}

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

/** Horizontal gradient matching temp colors along the strip (one stroke, not N lines). */
function buildTempGradientStops(
  points: PlotPoint[],
  domainMin: number,
  domainMax: number,
): { offset: string; color: string }[] {
  if (points.length === 0) return [];
  const x0 = points[0].x;
  const span = points[points.length - 1].x - x0 || 1;
  const stops: { offset: string; color: string }[] = [];
  let lastColor = "";

  for (let i = 0; i < points.length; i++) {
    const color = tempStrokeColor(points[i].value, domainMin, domainMax);
    const isEdge = i === 0 || i === points.length - 1;
    if (!isEdge && color === lastColor) continue;
    lastColor = color;
    stops.push({
      offset: `${(((points[i].x - x0) / span) * 100).toFixed(2)}%`,
      color,
    });
  }
  return stops;
}

const VISIBLE_BUFFER = 4;

const MetaStrip = memo(function MetaStrip({
  items,
  locale,
  speedUnit,
  rangeStart,
  rangeEnd,
}: {
  items: HourlyForecastItem[];
  locale: AppLocale;
  speedUnit: SpeedUnit;
  rangeStart: number;
  rangeEnd: number;
}) {
  const speedFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    [locale],
  );
  const speedSuffix = speedUnit === "mph" ? "mph" : "km/h";
  const cols = Math.max(items.length, 1);
  const gridStyle = {
    gridTemplateColumns: `repeat(${cols}, ${HOURLY_COL_WIDTH}px)`,
  } as const;

  const start = Math.max(0, rangeStart);
  const end = Math.min(items.length - 1, rangeEnd);

  const cells = [];
  for (let index = start; index <= end; index++) {
    cells.push(items[index]);
  }

  return (
    <>
      <div className="grid" style={gridStyle}>
        {cells.map((item, i) => {
          const index = start + i;
          return (
            <div
              key={`icon-${item.time}`}
              className="hourly-meta-cell flex items-center justify-center py-0.5"
              style={{ gridColumn: index + 1 }}
            >
              <WeatherIcon
                condition={item.condition}
                isDay={item.isDay}
                size={20}
              />
            </div>
          );
        })}
      </div>

      <div className="grid" style={gridStyle}>
        {cells.map((item, i) => {
          const index = start + i;
          const speed = toDisplaySpeed(item.windSpeed, speedUnit);
          return (
            <div
              key={`wind-${item.time}`}
              className="hourly-meta-cell flex items-center justify-center py-0.5 text-center text-[0.65rem] text-[var(--text-primary)] sm:text-xs"
              style={{ gridColumn: index + 1 }}
            >
              {speedFormatter.format(speed)} {speedSuffix}
            </div>
          );
        })}
      </div>

      <div className="grid pt-0.5" style={gridStyle}>
        {cells.map((item, i) => {
          const index = start + i;
          return (
            <div
              key={`time-${item.time}`}
              className="hourly-meta-cell truncate px-0.5 text-center text-[0.65rem] text-[var(--text-muted)] sm:text-xs"
              style={{ gridColumn: index + 1 }}
            >
              {formatHour(item.time, locale)}
            </div>
          );
        })}
      </div>
    </>
  );
});

export const HourlyCombinedChart = memo(function HourlyCombinedChart({
  items,
  scrollToIndex = 0,
  scrollDurationMs = 0,
  locationId,
  onScrollColumn,
  onProgrammaticScrollEnd,
  className,
}: HourlyCombinedChartProps) {
  const locale = useLocale();
  const temperatureUnit = useSettingsStore((s) => s.temperatureUnit);
  const speedUnit = useSettingsStore((s) => s.speedUnit);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 24 });
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;
  const pointerRafRef = useRef(0);
  const tooltipRafRef = useRef(0);
  const pointerPosRef = useRef({ x: 0, y: 0 });

  const onGrabChange = useCallback((grabbing: boolean) => {
    if (grabbing && activeIndexRef.current != null) {
      setActiveIndex(null);
      setTooltipPos(null);
    }
  }, []);

  const { ref: scrollRef, grabbingRef } = useGrabScroll<HTMLDivElement>({
    onGrabChange,
  });

  const gradientId = useMemo(
    () => `hourly-${Math.random().toString(36).slice(2, 9)}`,
    [],
  );
  const onScrollColumnRef = useRef(onScrollColumn);
  onScrollColumnRef.current = onScrollColumn;
  const onProgrammaticScrollEndRef = useRef(onProgrammaticScrollEnd);
  onProgrammaticScrollEndRef.current = onProgrammaticScrollEnd;

  useEffect(() => {
    setMounted(true);
  }, []);

  const hourly = items;
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
  const precipLinePath = useMemo(
    () => buildSmoothPath(precipPoints),
    [precipPoints],
  );
  const tempLinePath = useMemo(
    () => buildSmoothPath(tempPoints),
    [tempPoints],
  );
  const tempGradientStops = useMemo(
    () => buildTempGradientStops(tempPoints, domainMin, domainMax),
    [tempPoints, domainMin, domainMax],
  );
  const tempGradientX = useMemo(() => {
    if (tempPoints.length === 0) return { x1: 0, x2: 0 };
    return {
      x1: tempPoints[0].x,
      x2: tempPoints[tempPoints.length - 1].x,
    };
  }, [tempPoints]);

  const updateActiveIndex = useCallback(
    (clientX: number, clientY: number) => {
      if (grabbingRef.current) return;
      pointerPosRef.current = { x: clientX, y: clientY };
      if (pointerRafRef.current) return;

      pointerRafRef.current = requestAnimationFrame(() => {
        pointerRafRef.current = 0;
        if (grabbingRef.current) return;

        const { x: px, y: py } = pointerPosRef.current;
        const scrollEl = scrollRef.current;
        if (!scrollEl) return;

        const rect = scrollEl.getBoundingClientRect();
        const localY = py - rect.top;
        if (localY < 0 || localY > CHART_HEIGHT) {
          setActiveIndex((prev) => (prev == null ? prev : null));
          return;
        }

        const x = px - rect.left + scrollEl.scrollLeft;
        const index = Math.floor(x / HOURLY_COL_WIDTH);
        const next =
          index >= 0 && index < hourly.length ? index : null;
        setActiveIndex((prev) => (prev === next ? prev : next));
      });
    },
    [grabbingRef, hourly.length, scrollRef],
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
    if (tooltipRafRef.current) cancelAnimationFrame(tooltipRafRef.current);
    tooltipRafRef.current = requestAnimationFrame(() => {
      tooltipRafRef.current = 0;
      if (activeIndex == null || grabbingRef.current) {
        setTooltipPos((prev) => (prev == null ? prev : null));
        return;
      }

      const scrollEl = scrollRef.current;
      if (!scrollEl) return;

      const { tempPoints: tempsPts, precipPoints: precipPts } =
        pointsRef.current;
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
    });
  }, [activeIndex, grabbingRef, scrollRef]);

  useLayoutEffect(() => {
    syncTooltipPos();
  }, [syncTooltipPos]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
    const target = Math.min(
      maxScroll,
      Math.max(0, scrollToIndex * HOURLY_COL_WIDTH),
    );

    if (Math.abs(el.scrollLeft - target) < 0.5 && scrollDurationMs <= 0) {
      onProgrammaticScrollEndRef.current?.();
      return;
    }

    const signal = { cancelled: false };
    animateScrollLeft(el, target, scrollDurationMs, signal, () => {
      if (!signal.cancelled) onProgrammaticScrollEndRef.current?.();
    });
    return () => {
      signal.cancelled = true;
    };
  }, [scrollToIndex, scrollDurationMs, locationId, contentWidth, scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let ticking = false;
    let lastCol = -1;

    const updateVisibleRange = () => {
      const width = el.clientWidth || HOURLY_COL_WIDTH * 12;
      const start = Math.max(
        0,
        Math.floor(el.scrollLeft / HOURLY_COL_WIDTH) - VISIBLE_BUFFER,
      );
      const end = Math.min(
        hourly.length - 1,
        Math.ceil((el.scrollLeft + width) / HOURLY_COL_WIDTH) + VISIBLE_BUFFER,
      );
      setVisibleRange((prev) =>
        prev.start === start && prev.end === end ? prev : { start, end },
      );
    };

    const emit = () => {
      ticking = false;
      updateVisibleRange();
      const col = Math.max(
        0,
        Math.min(
          hourly.length - 1,
          Math.round(el.scrollLeft / HOURLY_COL_WIDTH),
        ),
      );
      if (col === lastCol) return;
      lastCol = col;
      onScrollColumnRef.current?.(col);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(emit);
    };

    updateVisibleRange();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateVisibleRange);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateVisibleRange);
    };
  }, [scrollRef, hourly.length]);

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
    <div className={cn("min-h-0 min-w-0 w-full max-w-full flex-1", className)}>
      <div
        ref={scrollRef}
        className="hourly-chart-scroll scrollbar-none min-w-0 max-w-full overflow-x-auto"
        onPointerMove={(event) =>
          updateActiveIndex(event.clientX, event.clientY)
        }
        onPointerLeave={() => setActiveIndex(null)}
      >
        <div className="hourly-chart-strip pb-0.5" style={{ width: contentWidth }}>
          <div className="relative" style={{ height: CHART_HEIGHT }}>
            <svg
              width={contentWidth}
              height={CHART_HEIGHT}
              className="block overflow-visible"
              aria-hidden
            >
              <defs>
                <linearGradient
                  id={`${gradientId}-precip`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="rgba(110, 200, 255, 0.22)" />
                  <stop offset="100%" stopColor="rgba(110, 200, 255, 0.02)" />
                </linearGradient>
                <linearGradient
                  id={`${gradientId}-temp-fill`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="rgba(255, 255, 255, 0.22)" />
                  <stop offset="100%" stopColor="rgba(255, 255, 255, 0.02)" />
                </linearGradient>
                <linearGradient
                  id={`${gradientId}-temp-stroke`}
                  gradientUnits="userSpaceOnUse"
                  x1={tempGradientX.x1}
                  y1={0}
                  x2={tempGradientX.x2}
                  y2={0}
                >
                  {tempGradientStops.map((stop) => (
                    <stop
                      key={stop.offset}
                      offset={stop.offset}
                      stopColor={stop.color}
                    />
                  ))}
                </linearGradient>
              </defs>
              {precipAreaPath ? (
                <path d={precipAreaPath} fill={`url(#${gradientId}-precip)`} />
              ) : null}
              {precipLinePath ? (
                <path
                  d={precipLinePath}
                  fill="none"
                  stroke="var(--accent-cool)"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
              {tempAreaPath ? (
                <path
                  d={tempAreaPath}
                  fill={`url(#${gradientId}-temp-fill)`}
                />
              ) : null}
              {tempLinePath ? (
                <path
                  d={tempLinePath}
                  fill="none"
                  stroke={`url(#${gradientId}-temp-stroke)`}
                  strokeWidth={2.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : null}
              {activeIndex != null ? (
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
              {tempPoints.map((point, index) => {
                if (
                  index < visibleRange.start ||
                  index > visibleRange.end ||
                  activeIndex === index
                ) {
                  return null;
                }
                return (
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
                );
              })}
            </svg>
          </div>

          <MetaStrip
            items={hourly}
            locale={locale}
            speedUnit={speedUnit}
            rangeStart={visibleRange.start}
            rangeEnd={visibleRange.end}
          />
        </div>
      </div>

      {mounted &&
        tooltipPos &&
        activeTemp != null &&
        createPortal(
          <div
            className="glass-menu-tip pointer-events-none fixed z-[200] -translate-x-1/2 -translate-y-full whitespace-nowrap px-2.5 py-1 text-[0.65rem] font-medium sm:text-xs"
            style={{
              left: tooltipPos.left,
              top: tooltipPos.top,
              marginTop: -6,
            }}
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
});
