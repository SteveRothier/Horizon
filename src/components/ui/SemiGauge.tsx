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

/**
 * Compact upper semi-circular gauge (AQI / UV).
 * Progress uses stroke-dasharray on a fixed path (avoids SVG arc-flag bugs).
 */
export function SemiGauge({
  value,
  max = 100,
  label,
  sublabel,
  className,
  color = "var(--accent)",
}: SemiGaugeProps) {
  const clamped = Math.max(0, Math.min(value, max));
  const ratio = max > 0 ? clamped / max : 0;

  const r = 40;
  const cx = 50;
  const cy = 50;
  const left = cx - r;
  const right = cx + r;
  // Fixed upper semicircle: left → top → right (clockwise in SVG y-down).
  const arc = `M ${left} ${cy} A ${r} ${r} 0 0 1 ${right} ${cy}`;
  // Normalized path length so dasharray is simply percentage-based.
  const pathLen = 100;
  const filled = ratio * pathLen;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center",
        className,
      )}
    >
      <svg
        viewBox="0 0 100 60"
        className="h-auto w-full max-w-[9rem]"
        aria-hidden
      >
        <path
          d={arc}
          pathLength={pathLen}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {ratio > 0.001 ? (
          <path
            d={arc}
            pathLength={pathLen}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${pathLen}`}
          />
        ) : null}
        <text
          x="50"
          y="46"
          textAnchor="middle"
          className="fill-white font-semibold"
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
