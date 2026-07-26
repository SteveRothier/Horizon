"use client";

import { cn } from "@/utils/cn";

type SemiGaugeProps = {
  value: number;
  max?: number;
  label: string;
  sublabel?: string;
  className?: string;
  /** CSS color for the arc */
  color?: string;
};

/** Compact semi-circular gauge (AQI / UV) */
export function SemiGauge({
  value,
  max = 100,
  label,
  sublabel,
  className,
  color = "var(--accent)",
}: SemiGaugeProps) {
  const clamped = Math.max(0, Math.min(value, max));
  const ratio = clamped / max;
  const r = 42;
  const cx = 50;
  const cy = 50;
  const startAngle = Math.PI;
  const endAngle = Math.PI + Math.PI * ratio;

  const polar = (angle: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  });

  const start = polar(startAngle);
  const end = polar(endAngle);
  const largeArc = ratio > 0.5 ? 1 : 0;
  const trackEnd = polar(2 * Math.PI);

  const trackPath = `M ${start.x} ${start.y} A ${r} ${r} 0 1 1 ${trackEnd.x} ${trackEnd.y}`;
  const valuePath =
    ratio <= 0
      ? ""
      : `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center",
        className,
      )}
    >
      <svg viewBox="0 0 100 62" className="h-auto w-full max-w-[9rem]">
        <path
          d={trackPath}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {valuePath ? (
          <path
            d={valuePath}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
          />
        ) : null}
        <text
          x="50"
          y="48"
          textAnchor="middle"
          className="fill-white text-[18px] font-semibold"
          style={{ fontSize: "18px" }}
        >
          {Math.round(clamped)}
        </text>
      </svg>
      <p className="-mt-1 text-sm font-medium text-[var(--text-primary)]">
        {label}
      </p>
      {sublabel ? (
        <p className="text-center text-[0.65rem] leading-tight text-[var(--text-muted)]">
          {sublabel}
        </p>
      ) : null}
    </div>
  );
}
