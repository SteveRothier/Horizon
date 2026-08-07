import type { ReactElement } from "react";

/**
 * Shared Horizon mark for ImageResponse icons (mirrors icon.svg).
 * Uses inline styles only — next/og subset.
 */
export function HorizonAppIconMark({ size }: { size: number }): ReactElement {
  const sunR = size * (6.5 / 32);
  const groundTop = size * (20 / 32);
  const groundH = size * (9 / 32);
  const barH = Math.max(2, size * (2 / 32));
  const inset = size * (3 / 32);
  const radius = size * (8 / 32);
  const rim = Math.max(1, Math.round(size * (0.75 / 32)));
  const rimRadius = size * (7.25 / 32);
  const borderW = Math.max(1, Math.round(size * (1 / 32)));

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        position: "relative",
        borderRadius: radius,
        overflow: "hidden",
        background: "linear-gradient(180deg, #1a2744 0%, #0b1226 100%)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: size * (5 / 32),
          top: size * (12 / 32),
          width: size * (22 / 32),
          height: size * (16 / 32),
          borderRadius: size,
          background: "rgba(245, 197, 66, 0.22)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: size / 2 - sunR,
          top: groundTop - sunR,
          width: sunR * 2,
          height: sunR * 2,
          borderRadius: sunR,
          background: "linear-gradient(180deg, #ffe59a 0%, #f0a830 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: inset,
          top: groundTop,
          width: size - inset * 2,
          height: groundH,
          borderRadius: size * (1.5 / 32),
          background: "#0b1226",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: inset,
          top: groundTop,
          width: size - inset * 2,
          height: barH,
          borderRadius: size * (1 / 32),
          background: "#9ec9f0",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: rim,
          top: rim,
          width: size - rim * 2,
          height: size - rim * 2,
          borderRadius: rimRadius,
          borderWidth: borderW,
          borderStyle: "solid",
          borderColor: "rgba(255,255,255,0.28)",
        }}
      />
    </div>
  );
}
