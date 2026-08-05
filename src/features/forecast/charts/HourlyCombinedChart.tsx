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
import { useLocale, useT } from "@/hooks/useT";
import {
  useSettingsStore,
  type AppLocale,
  type SpeedUnit,
} from "@/stores/settingsStore";
import type { HourlyForecastItem } from "@/types/weather";
import { dateKeyFromTime } from "@/features/forecast/filterHourlyByDate";
import { formatDayShort, formatHour } from "@/utils/format";
import { tempFillColor, tempStrokeColor } from "@/utils/temp-color";
import { toDisplaySpeed, toDisplayTemp } from "@/utils/units";
import {
  precipFillColor,
  precipKindFromWeatherCode,
  precipStrokeColor,
  type PrecipKind,
} from "@/utils/weather-code";
import { cn } from "@/utils/cn";
import type { MessageKey } from "@/i18n/messages";

const HOURLY_COL_WIDTH = 56;

const CHART_MIN_HEIGHT = 112;
const CHART_TOP = 22;
const CHART_BOTTOM = 6;
const DAY_LINE_STROKE = "rgba(255, 255, 255, 0.16)";

type HourlyCombinedChartProps = {
  items: HourlyForecastItem[];
  /** Align this column to the left edge of the viewport. */
  scrollToIndex?: number;
  scrollDurationMs?: number;
  locationId?: string;
  /** Today’s YYYY-MM-DD — for “Auj.” labels and start bound. */
  todayDate?: string;
  /** Fired while the user (or animation) scrolls — column under the left edge. */
  onScrollColumn?: (columnIndex: number) => void;
  /** Fired when a programmatic scrollToIndex animation finishes (or is skipped). */
  onProgrammaticScrollEnd?: () => void;
  className?: string;
};

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
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
    if (t >= 1) {
      el.scrollLeft = to;
      onComplete?.();
      return;
    }
    el.scrollLeft = from + delta * easeOutCubic(t);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

type PlotPoint = { x: number; y: number; value: number; kind?: PrecipKind };

function precipKindLabelKey(kind: PrecipKind): MessageKey | null {
  if (kind === "none") return null;
  return `forecast.precip.${kind}` as MessageKey;
}

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

/** Horizontal gradient stops along the strip (shared by temp + precip). */
function buildHorizontalGradientStops(
  points: PlotPoint[],
  colorAt: (point: PlotPoint) => string,
): { offset: string; color: string }[] {
  if (points.length === 0) return [];
  const x0 = points[0].x;
  const span = points[points.length - 1].x - x0 || 1;
  const stops: { offset: string; color: string }[] = [];
  let lastColor = "";

  for (let i = 0; i < points.length; i++) {
    const color = colorAt(points[i]);
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

function buildTempGradientStops(
  points: PlotPoint[],
  domainMin: number,
  domainMax: number,
  mode: "stroke" | "fill" = "stroke",
): { offset: string; color: string }[] {
  return buildHorizontalGradientStops(points, (point) =>
    mode === "fill"
      ? tempFillColor(point.value, domainMin, domainMax, 0.36)
      : tempStrokeColor(point.value, domainMin, domainMax),
  );
}

function buildPrecipGradientStops(
  points: PlotPoint[],
  mode: "fill" | "stroke" = "fill",
): { offset: string; color: string }[] {
  return buildHorizontalGradientStops(points, (point) => {
    const t = Math.min(1, Math.max(0, point.value / 100));
    const kind = point.kind ?? "none";
    return mode === "stroke"
      ? precipStrokeColor(kind, t)
      : precipFillColor(kind, t);
  });
}

const VISIBLE_BUFFER = 4;
/** Extra columns for smooth path continuity beyond the visible strip. */
const PATH_BUFFER = 8;

type GradientStop = { offset: string; color: string };

type ChartSeriesLayerProps = {
  gradientId: string;
  contentWidth: number;
  chartHeight: number;
  baseline: number;
  maskWindow: { x: number; w: number };
  precipGradientX: { x1: number; x2: number };
  tempGradientX: { x1: number; x2: number };
  precipFillStops: GradientStop[];
  precipStrokeStops: GradientStop[];
  tempFillStops: GradientStop[];
  tempGradientStops: GradientStop[];
  precipAreaPath: string;
  precipLinePath: string;
  tempAreaPath: string;
  tempLinePath: string;
  precipMarkers: PlotPoint[];
  boundXs: Set<number>;
  dayStarts: { index: number; date: string }[];
  visibleRange: { start: number; end: number };
  locale: AppLocale;
};

const ChartSeriesLayer = memo(function ChartSeriesLayer({
  gradientId,
  contentWidth,
  chartHeight,
  baseline,
  maskWindow,
  precipGradientX,
  tempGradientX,
  precipFillStops,
  precipStrokeStops,
  tempFillStops,
  tempGradientStops,
  precipAreaPath,
  precipLinePath,
  tempAreaPath,
  tempLinePath,
  precipMarkers,
  boundXs,
  dayStarts,
  visibleRange,
  locale,
}: ChartSeriesLayerProps) {
  return (
    <>
      <defs>
        <linearGradient
          id={`${gradientId}-area-fade`}
          gradientUnits="userSpaceOnUse"
          x1={0}
          y1={CHART_TOP}
          x2={0}
          y2={baseline}
        >
          <stop offset="0%" stopColor="#fff" stopOpacity={1} />
          <stop offset="55%" stopColor="#fff" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask
          id={`${gradientId}-area-mask`}
          maskUnits="userSpaceOnUse"
          x={maskWindow.x}
          y={0}
          width={maskWindow.w}
          height={chartHeight}
        >
          <rect
            x={maskWindow.x}
            y={0}
            width={maskWindow.w}
            height={chartHeight}
            fill={`url(#${gradientId}-area-fade)`}
          />
        </mask>
        <linearGradient
          id={`${gradientId}-precip`}
          gradientUnits="userSpaceOnUse"
          x1={precipGradientX.x1}
          y1={0}
          x2={precipGradientX.x2}
          y2={0}
        >
          {precipFillStops.map((stop) => (
            <stop
              key={`p-${stop.offset}`}
              offset={stop.offset}
              stopColor={stop.color}
            />
          ))}
        </linearGradient>
        <linearGradient
          id={`${gradientId}-precip-stroke`}
          gradientUnits="userSpaceOnUse"
          x1={precipGradientX.x1}
          y1={0}
          x2={precipGradientX.x2}
          y2={0}
        >
          {precipStrokeStops.map((stop) => (
            <stop
              key={`ps-${stop.offset}`}
              offset={stop.offset}
              stopColor={stop.color}
            />
          ))}
        </linearGradient>
        <linearGradient
          id={`${gradientId}-temp-fill`}
          gradientUnits="userSpaceOnUse"
          x1={tempGradientX.x1}
          y1={0}
          x2={tempGradientX.x2}
          y2={0}
        >
          {tempFillStops.map((stop) => (
            <stop
              key={`f-${stop.offset}`}
              offset={stop.offset}
              stopColor={stop.color}
            />
          ))}
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
        <path
          d={precipAreaPath}
          fill={`url(#${gradientId}-precip)`}
          mask={`url(#${gradientId}-area-mask)`}
        />
      ) : null}
      {precipLinePath ? (
        <path
          d={precipLinePath}
          fill="none"
          stroke={`url(#${gradientId}-precip-stroke)`}
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
      {precipMarkers.map((point) => {
        const isHail = point.kind === "hail";
        const color = precipStrokeColor(point.kind ?? "storm", 1);
        return (
          <g
            key={`mk-${point.x}`}
            transform={`translate(${point.x}, ${point.y - 10})`}
          >
            {isHail ? (
              <polygon
                points="0,-5 4.5,0 0,5 -4.5,0"
                fill={color}
                stroke="var(--surface-elevated)"
                strokeWidth={0.75}
                opacity={0.95}
              />
            ) : (
              <path
                d="M1.5-6 L-2.5 0.5 H0.5 L-1.5 6 L3.5-0.5 H0.5 Z"
                fill={color}
                stroke="var(--surface-elevated)"
                strokeWidth={0.5}
                opacity={0.95}
              />
            )}
          </g>
        );
      })}
      {tempAreaPath ? (
        <path
          d={tempAreaPath}
          fill={`url(#${gradientId}-temp-fill)`}
          mask={`url(#${gradientId}-area-mask)`}
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
      {Array.from(boundXs).map((x) => (
        <line
          key={`bound-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={baseline}
          stroke={DAY_LINE_STROKE}
          strokeWidth={1}
        />
      ))}
      {dayStarts.map(({ index, date }) => {
        const x = index * HOURLY_COL_WIDTH;
        const isBound = boundXs.has(x);
        const inView =
          index >= visibleRange.start - 1 && index <= visibleRange.end + 1;
        if (!inView && !isBound) return null;
        return (
          <g key={`day-${date}-${index}`}>
            {!isBound ? (
              <line
                x1={x}
                y1={0}
                x2={x}
                y2={baseline}
                stroke={DAY_LINE_STROKE}
                strokeWidth={1}
                strokeDasharray="3 4"
              />
            ) : null}
            <text
              x={x + 4}
              y={11}
              textAnchor="start"
              fill="var(--text-muted)"
              fontSize={10}
              fontWeight={500}
            >
              {formatDayShort(date, locale)}
            </text>
          </g>
        );
      })}
      {/* contentWidth kept so the layer identity stays tied to strip size */}
      <rect width={contentWidth} height={0} fill="none" />
    </>
  );
});

type ChartHoverTooltipProps = {
  left: number;
  top: number;
  temp: number;
  precip: number;
  precipColor: string;
  precipLabel: string | null;
};

const ChartHoverTooltip = memo(function ChartHoverTooltip({
  left,
  top,
  temp,
  precip,
  precipColor,
  precipLabel,
}: ChartHoverTooltipProps) {
  return (
    <div
      className="glass-menu-tip pointer-events-none fixed z-[200] -translate-x-1/2 -translate-y-full whitespace-nowrap px-2.5 py-1 text-[0.65rem] font-medium sm:text-xs"
      style={{ left, top, marginTop: -6 }}
      role="status"
      aria-live="polite"
    >
      <span className="text-[var(--text-primary)]">{temp}°</span>
      <span className="text-[var(--text-muted)]"> · </span>
      <span style={{ color: precipColor }}>
        {precip}%
        {precipLabel ? ` ${precipLabel}` : null}
      </span>
    </div>
  );
});

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
              className="hourly-meta-cell flex items-center justify-center"
              style={{ gridColumn: index + 1 }}
            >
              <WeatherIcon
                condition={item.condition}
                isDay={item.isDay}
                size={18}
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
              className="hourly-meta-cell flex items-center justify-center text-center text-[0.65rem] text-[var(--text-primary)] sm:text-xs"
              style={{ gridColumn: index + 1 }}
            >
              {speedFormatter.format(speed)} {speedSuffix}
            </div>
          );
        })}
      </div>

      <div className="grid" style={gridStyle}>
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
  todayDate,
  onScrollColumn,
  onProgrammaticScrollEnd,
  className,
}: HourlyCombinedChartProps) {
  const locale = useLocale();
  const t = useT();
  const temperatureUnit = useSettingsStore((s) => s.temperatureUnit);
  const speedUnit = useSettingsStore((s) => s.speedUnit);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const [chartHeight, setChartHeight] = useState(96);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 24 });
  const chartRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;
  const coarseRef = useRef(false);
  const pointerRafRef = useRef(0);
  const tooltipRafRef = useRef(0);
  const pointerPosRef = useRef({ x: 0, y: 0 });
  const hourlyLenRef = useRef(0);

  const onGrabChange = useCallback((grabbing: boolean) => {
    if (grabbing && activeIndexRef.current != null) {
      setActiveIndex(null);
      setTooltipPos(null);
    }
  }, []);

  const onTap = useCallback((event: PointerEvent) => {
    if (!coarseRef.current) return;

    const chartEl = chartRef.current;
    if (!chartEl) return;

    const chartRect = chartEl.getBoundingClientRect();
    const x = event.clientX - chartRect.left;
    const index = Math.floor(x / HOURLY_COL_WIDTH);
    if (index < 0 || index >= hourlyLenRef.current) return;

    setActiveIndex((prev) => (prev === index ? null : index));
  }, []);

  const { ref: scrollRef, grabbingRef } = useGrabScroll<HTMLDivElement>({
    onGrabChange,
    onTap,
  });

  const gradientId = useMemo(
    () => `hourly-${Math.random().toString(36).slice(2, 9)}`,
    [],
  );
  const scrollToIndexRef = useRef(scrollToIndex);
  scrollToIndexRef.current = scrollToIndex;
  const onScrollColumnRef = useRef(onScrollColumn);
  onScrollColumnRef.current = onScrollColumn;
  const onProgrammaticScrollEndRef = useRef(onProgrammaticScrollEnd);
  onProgrammaticScrollEndRef.current = onProgrammaticScrollEnd;
  const animatingRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (pointerRafRef.current) cancelAnimationFrame(pointerRafRef.current);
      if (tooltipRafRef.current) cancelAnimationFrame(tooltipRafRef.current);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mqCoarse = window.matchMedia("(pointer: coarse)");
    const mqNarrow = window.matchMedia("(max-width: 767px)");
    const update = () => {
      const next = mqCoarse.matches || mqNarrow.matches;
      coarseRef.current = next;
      setCoarsePointer(next);
    };
    update();
    mqCoarse.addEventListener("change", update);
    mqNarrow.addEventListener("change", update);
    return () => {
      mqCoarse.removeEventListener("change", update);
      mqNarrow.removeEventListener("change", update);
    };
  }, []);

  useLayoutEffect(() => {
    const el = chartRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const update = () => {
      setChartHeight(Math.max(CHART_MIN_HEIGHT, Math.round(el.clientHeight)));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hourly = items;
  hourlyLenRef.current = hourly.length;
  const contentWidth = Math.max(hourly.length, 1) * HOURLY_COL_WIDTH;

  const dayStarts = useMemo(() => {
    const starts: { index: number; date: string }[] = [];
    let prev = "";
    for (let i = 0; i < hourly.length; i++) {
      const date = dateKeyFromTime(hourly[i].time);
      if (date !== prev) {
        starts.push({ index: i, date });
        prev = date;
      }
    }
    return starts;
  }, [hourly]);

  const todayStartIndex = useMemo(() => {
    if (!todayDate || hourly.length === 0) return 0;
    const found = dayStarts.find((d) => d.date === todayDate);
    return found?.index ?? 0;
  }, [dayStarts, hourly.length, todayDate]);

  const boundXs = useMemo(() => {
    const xs = new Set<number>();
    xs.add(todayStartIndex * HOURLY_COL_WIDTH);
    xs.add(contentWidth);
    return xs;
  }, [contentWidth, todayStartIndex]);

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
      const plotHeight = chartHeight - CHART_TOP - CHART_BOTTOM;
      const baseline = chartHeight - CHART_BOTTOM;

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
          kind: precipKindFromWeatherCode(item.weatherCode),
        };
      });

      return { tempPoints, precipPoints, domainMin, domainMax, baseline };
    }, [hourly, temperatureUnit, chartHeight]);

  // Points étendus pour le rendu SVG : premier point à x=0, dernier à x=contentWidth
  const tempRenderPoints = useMemo(() => {
    if (tempPoints.length === 0) return tempPoints;
    return tempPoints.map((p, i) => ({
      ...p,
      x:
        i === 0
          ? 0
          : i === tempPoints.length - 1
            ? contentWidth
            : p.x,
    }));
  }, [tempPoints, contentWidth]);

  const precipRenderPoints = useMemo(() => {
    if (precipPoints.length === 0) return precipPoints;
    return precipPoints.map((p, i) => ({
      ...p,
      x:
        i === 0
          ? 0
          : i === precipPoints.length - 1
            ? contentWidth
            : p.x,
    }));
  }, [precipPoints, contentWidth]);

  const pathWindow = useMemo(() => {
    const start = Math.max(0, visibleRange.start - PATH_BUFFER);
    const end = Math.min(
      Math.max(tempRenderPoints.length, precipRenderPoints.length),
      visibleRange.end + PATH_BUFFER,
    );
    return { start, end };
  }, [
    visibleRange.start,
    visibleRange.end,
    tempRenderPoints.length,
    precipRenderPoints.length,
  ]);

  const tempWindowPoints = useMemo(
    () => tempRenderPoints.slice(pathWindow.start, pathWindow.end),
    [tempRenderPoints, pathWindow],
  );
  const precipWindowPoints = useMemo(
    () => precipRenderPoints.slice(pathWindow.start, pathWindow.end),
    [precipRenderPoints, pathWindow],
  );
  const tempWindowForGradient = useMemo(
    () => tempPoints.slice(pathWindow.start, pathWindow.end),
    [tempPoints, pathWindow],
  );
  const precipWindowForGradient = useMemo(
    () => precipPoints.slice(pathWindow.start, pathWindow.end),
    [precipPoints, pathWindow],
  );

  const precipAreaPath = useMemo(
    () => buildAreaPath(precipWindowPoints, baseline),
    [precipWindowPoints, baseline],
  );
  const tempAreaPath = useMemo(
    () => buildAreaPath(tempWindowPoints, baseline),
    [tempWindowPoints, baseline],
  );
  const precipLinePath = useMemo(
    () => buildSmoothPath(precipWindowPoints),
    [precipWindowPoints],
  );
  const tempLinePath = useMemo(
    () => buildSmoothPath(tempWindowPoints),
    [tempWindowPoints],
  );
  const tempGradientStops = useMemo(
    () =>
      buildTempGradientStops(
        tempWindowForGradient,
        domainMin,
        domainMax,
        "stroke",
      ),
    [tempWindowForGradient, domainMin, domainMax],
  );
  const tempFillStops = useMemo(
    () =>
      buildTempGradientStops(
        tempWindowForGradient,
        domainMin,
        domainMax,
        "fill",
      ),
    [tempWindowForGradient, domainMin, domainMax],
  );
  const precipFillStops = useMemo(
    () => buildPrecipGradientStops(precipWindowForGradient, "fill"),
    [precipWindowForGradient],
  );
  const precipStrokeStops = useMemo(
    () => buildPrecipGradientStops(precipWindowForGradient, "stroke"),
    [precipWindowForGradient],
  );
  const precipMarkers = useMemo(
    () =>
      precipWindowForGradient.filter(
        (p) => p.kind === "storm" || p.kind === "hail",
      ),
    [precipWindowForGradient],
  );
  const tempGradientX = useMemo(() => {
    if (tempWindowForGradient.length === 0) return { x1: 0, x2: 0 };
    return {
      x1: tempWindowForGradient[0].x,
      x2: tempWindowForGradient[tempWindowForGradient.length - 1].x,
    };
  }, [tempWindowForGradient]);
  const precipGradientX = useMemo(() => {
    if (precipWindowForGradient.length === 0) return { x1: 0, x2: 0 };
    return {
      x1: precipWindowForGradient[0].x,
      x2: precipWindowForGradient[precipWindowForGradient.length - 1].x,
    };
  }, [precipWindowForGradient]);

  const maskWindow = useMemo(() => {
    const x = Math.max(0, pathWindow.start * HOURLY_COL_WIDTH);
    const w = Math.max(
      HOURLY_COL_WIDTH,
      (pathWindow.end - pathWindow.start) * HOURLY_COL_WIDTH,
    );
    return { x, w };
  }, [pathWindow]);

  const updateActiveIndex = useCallback(
    (clientX: number, clientY: number) => {
      if (grabbingRef.current) return;
      pointerPosRef.current = { x: clientX, y: clientY };
      if (pointerRafRef.current) return;

      pointerRafRef.current = requestAnimationFrame(() => {
        pointerRafRef.current = 0;
        if (grabbingRef.current) return;

        const { x: px, y: py } = pointerPosRef.current;
        const chartEl = chartRef.current;
        if (!chartEl) return;

        const chartRect = chartEl.getBoundingClientRect();
        if (py < chartRect.top || py > chartRect.bottom) {
          setActiveIndex((prev) => (prev == null ? prev : null));
          return;
        }

        // chartRef lives inside the scrolled strip — rect.left already
        // includes scroll offset; do not add scrollLeft again.
        const x = px - chartRect.left;
        const index = Math.floor(x / HOURLY_COL_WIDTH);
        const next =
          index >= 0 && index < hourly.length ? index : null;
        setActiveIndex((prev) => (prev === next ? prev : next));
      });
    },
    [grabbingRef, hourly.length],
  );

  const activeTemp =
    activeIndex != null ? tempPoints[activeIndex]?.value : null;
  const activePrecip =
    activeIndex != null ? precipPoints[activeIndex]?.value : null;
  const activePrecipKind =
    activeIndex != null ? precipPoints[activeIndex]?.kind : undefined;
  const activePrecipLabelKey = activePrecipKind
    ? precipKindLabelKey(activePrecipKind)
    : null;
  const activePrecipColor =
    activePrecipKind != null
      ? precipStrokeColor(activePrecipKind, Math.min(1, (activePrecip ?? 0) / 100))
      : "var(--accent-cool)";
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

      const chartEl = chartRef.current;
      if (!chartEl) return;

      const { tempPoints: tempsPts, precipPoints: precipPts } =
        pointsRef.current;
      const chartRect = chartEl.getBoundingClientRect();
      const chartY = Math.min(
        tempsPts[activeIndex]?.y ?? CHART_TOP,
        precipPts[activeIndex]?.y ?? CHART_TOP,
      );
      // chartRect.left already reflects scroll; no scrollLeft subtraction.
      const next = {
        left:
          chartRect.left +
          activeIndex * HOURLY_COL_WIDTH +
          HOURLY_COL_WIDTH / 2,
        top: chartRect.top + chartY - 8,
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
  }, [activeIndex, grabbingRef]);

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
      animatingRef.current = false;
      onProgrammaticScrollEndRef.current?.();
      return;
    }

    const signal = { cancelled: false };
    animatingRef.current = true;
    animateScrollLeft(el, target, scrollDurationMs, signal, () => {
      animatingRef.current = false;
      if (!signal.cancelled) onProgrammaticScrollEndRef.current?.();
    });
    return () => {
      signal.cancelled = true;
      animatingRef.current = false;
    };
  }, [scrollToIndex, scrollDurationMs, locationId, contentWidth, scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const syncScrollLeft = () => {
      if (animatingRef.current) return;
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      const target = Math.min(
        maxScroll,
        Math.max(0, scrollToIndexRef.current * HOURLY_COL_WIDTH),
      );
      if (Math.abs(el.scrollLeft - target) > 1) {
        el.scrollLeft = target;
      }
    };

    const ro = new ResizeObserver(syncScrollLeft);
    ro.observe(el);
    window.addEventListener("resize", syncScrollLeft);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", syncScrollLeft);
    };
  }, [scrollRef, contentWidth]);

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

  useEffect(() => {
    if (!coarsePointer || activeIndex == null) return;

    const onPointerDownCapture = (event: PointerEvent) => {
      const scrollEl = scrollRef.current;
      if (!scrollEl) return;
      if (event.target instanceof Node && scrollEl.contains(event.target)) {
        return;
      }
      setActiveIndex(null);
      setTooltipPos(null);
    };

    document.addEventListener("pointerdown", onPointerDownCapture, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDownCapture, true);
    };
  }, [coarsePointer, activeIndex, scrollRef]);

  return (
    <div
      className={cn(
        "flex h-full min-h-0 min-w-0 w-full max-w-full flex-col",
        className,
      )}
    >
      <div
        ref={scrollRef}
        className="hourly-chart-scroll scrollbar-none flex min-h-0 w-full min-w-0 max-w-full flex-1 overflow-x-auto overflow-y-hidden"
        onPointerMove={
          coarsePointer
            ? undefined
            : (event) => updateActiveIndex(event.clientX, event.clientY)
        }
        onPointerLeave={
          coarsePointer ? undefined : () => setActiveIndex(null)
        }
      >
        <div
          className="hourly-chart-strip"
          style={{ width: contentWidth }}
        >
          <div ref={chartRef} className="relative min-h-0 flex-1">
            <svg
              width={contentWidth}
              height={chartHeight}
              className="block overflow-visible"
              aria-hidden
            >
              <ChartSeriesLayer
                gradientId={gradientId}
                contentWidth={contentWidth}
                chartHeight={chartHeight}
                baseline={baseline}
                maskWindow={maskWindow}
                precipGradientX={precipGradientX}
                tempGradientX={tempGradientX}
                precipFillStops={precipFillStops}
                precipStrokeStops={precipStrokeStops}
                tempFillStops={tempFillStops}
                tempGradientStops={tempGradientStops}
                precipAreaPath={precipAreaPath}
                precipLinePath={precipLinePath}
                tempAreaPath={tempAreaPath}
                tempLinePath={tempLinePath}
                precipMarkers={precipMarkers}
                boundXs={boundXs}
                dayStarts={dayStarts}
                visibleRange={visibleRange}
                locale={locale}
              />

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
                const nearDayStart = dayStarts.some(
                  (d) => Math.abs(d.index - index) <= 0,
                );
                if (nearDayStart && point.y < CHART_TOP + 18) {
                  return null;
                }
                return (
                  <text
                    key={`label-${point.x}`}
                    x={point.x}
                    y={point.y - 6}
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

          <div className="shrink-0">
            <MetaStrip
              items={hourly}
              locale={locale}
              speedUnit={speedUnit}
              rangeStart={visibleRange.start}
              rangeEnd={visibleRange.end}
            />
          </div>
        </div>
      </div>

      {mounted &&
        tooltipPos &&
        activeTemp != null &&
        createPortal(
          <ChartHoverTooltip
            left={tooltipPos.left}
            top={tooltipPos.top}
            temp={activeTemp}
            precip={activePrecip ?? 0}
            precipColor={activePrecipColor}
            precipLabel={
              activePrecipLabelKey ? t(activePrecipLabelKey) : null
            }
          />,
          document.body,
        )}
    </div>
  );
});
