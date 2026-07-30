"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useIsMobileUi } from "@/hooks/useIsMobileUi";
import type { DayPeriod, WeatherCondition } from "@/types/weather";
import { cn } from "@/utils/cn";

type WeatherBackgroundProps = {
  condition: WeatherCondition;
  period: DayPeriod;
  className?: string;
};

function seeded(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/** Stable CSS numbers — avoid SSR/client float serialization mismatches */
function pct(n: number): string {
  return `${(Math.round(n * 10000) / 100).toFixed(2)}%`;
}

function px(n: number): string {
  return `${(Math.round(n * 100) / 100).toFixed(2)}px`;
}

export function WeatherBackground({
  condition,
  period,
  className,
}: WeatherBackgroundProps) {
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobileUi();
  const reduceMotionHook = useReducedMotion();
  // Until mounted, assume reduced motion so SSR markup stays simple/static
  const reduceMotion = !mounted || !!reduceMotionHook || isMobile;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={cn("fixed inset-0 overflow-hidden", className)}
      aria-hidden
    >
      <GradientLayer />
      <AtmosphereLayer />

      {mounted ? (
        <>
          {period === "night" && condition !== "storm" ? (
            <NightSky reduceMotion={reduceMotion} light={isMobile} />
          ) : null}

          {(condition === "cloudy" ||
            condition === "rain" ||
            condition === "storm" ||
            condition === "snow" ||
            (condition === "clear" && period === "day")) && (
            <Clouds
              reduceMotion={reduceMotion}
              density={
                isMobile
                  ? "light"
                  : condition === "storm"
                    ? "heavy"
                    : condition === "clear"
                      ? "light"
                      : "medium"
              }
              dark={
                condition === "storm" ||
                condition === "rain" ||
                period === "night"
              }
            />
          )}

          {condition === "rain" || condition === "storm" ? (
            <Rain
              reduceMotion={reduceMotion}
              heavy={condition === "storm"}
              light={isMobile}
            />
          ) : null}

          {condition === "storm" && !isMobile ? (
            <Lightning reduceMotion={reduceMotion} />
          ) : null}

          {condition === "snow" ? (
            <Snow reduceMotion={reduceMotion} light={isMobile} />
          ) : null}

          {condition === "fog" ? (
            <Fog reduceMotion={reduceMotion} />
          ) : null}

          {condition === "clear" && period === "day" && !isMobile ? (
            <GoldenParticles reduceMotion={reduceMotion} />
          ) : null}
        </>
      ) : null}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_65%,rgba(0,0,0,0.28)_100%)]" />
    </div>
  );
}

/** CSS vars already update with data-weather/period — no remount flash. */
function GradientLayer() {
  return (
    <div
      className="absolute inset-0 transition-[opacity] duration-500"
      style={{
        background:
          "linear-gradient(145deg, var(--scene-from) 0%, var(--scene-via) 48%, var(--scene-to) 100%)",
      }}
    />
  );
}

/** Subtle atmospheric depth — CSS mesh, no blur or motion. */
function AtmosphereLayer() {
  return (
    <div
      className="absolute inset-0 transition-[opacity] duration-500"
      style={{
        background: `
          radial-gradient(ellipse 90% 55% at 15% -5%, var(--scene-atmo-a) 0%, transparent 52%),
          radial-gradient(ellipse 70% 45% at 95% 105%, var(--scene-atmo-b) 0%, transparent 48%),
          radial-gradient(ellipse 50% 35% at 50% 40%, var(--scene-atmo-c) 0%, transparent 55%)
        `,
      }}
    />
  );
}

function NightSky({
  reduceMotion,
  light,
}: {
  reduceMotion: boolean;
  light?: boolean;
}) {
  const count = light ? 12 : 36;
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: pct(seeded(i + 1) * 100),
        top: pct(seeded(i + 40) * 70),
        size: px(1 + seeded(i + 80) * 2),
        delay: `${Math.round(seeded(i + 120) * 400) / 100}s`,
        duration: `${Math.round((2 + seeded(i + 160) * 3) * 100) / 100}s`,
      })),
    [count],
  );

  return (
    <>
      {stars.map((s) => (
        <span
          key={s.id}
          className={cn(
            "absolute rounded-full bg-white",
            !reduceMotion && "scene-star",
          )}
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            opacity: reduceMotion ? 0.7 : undefined,
            ["--dur" as string]: s.duration,
            ["--delay" as string]: s.delay,
          }}
        />
      ))}
    </>
  );
}

function Clouds({
  reduceMotion,
  density,
  dark,
}: {
  reduceMotion: boolean;
  density: "light" | "medium" | "heavy";
  dark: boolean;
}) {
  const count = density === "light" ? 3 : density === "medium" ? 5 : 7;
  const clouds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        top: `${8 + seeded(i + 2) * 45}%`,
        width: 120 + seeded(i + 5) * 180,
        height: 40 + seeded(i + 8) * 50,
        duration: 40 + seeded(i + 11) * 50,
        delay: -seeded(i + 14) * 30,
        opacity: dark ? 0.25 + seeded(i) * 0.25 : 0.35 + seeded(i) * 0.3,
      })),
    [count, dark],
  );

  return (
    <>
      {clouds.map((c) => (
        <motion.div
          key={c.id}
          className="absolute rounded-[100%] blur-md"
          style={{
            top: c.top,
            width: c.width,
            height: c.height,
            background: dark
              ? "rgba(30, 40, 60, 0.7)"
              : "rgba(255, 255, 255, 0.45)",
            opacity: c.opacity,
            boxShadow: dark
              ? "40px 10px 0 -8px rgba(25,35,55,0.5), -35px 8px 0 -6px rgba(20,30,50,0.4)"
              : "40px 10px 0 -8px rgba(255,255,255,0.35), -35px 8px 0 -6px rgba(255,255,255,0.3)",
          }}
          initial={{ x: "-30vw" }}
          animate={
            reduceMotion
              ? { x: "20vw" }
              : { x: ["-30vw", "110vw"] }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: c.duration,
                  repeat: Infinity,
                  ease: "linear",
                  delay: c.delay,
                }
          }
        />
      ))}
    </>
  );
}

function Rain({
  reduceMotion,
  heavy,
  light,
}: {
  reduceMotion: boolean;
  heavy: boolean;
  light?: boolean;
}) {
  const count = light ? 12 : heavy ? 48 : 32;
  const drops = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: pct(seeded(i + 3) * 100),
        delay: `${Math.round(seeded(i + 7) * 150) / 100}s`,
        duration: `${Math.round(((heavy ? 0.45 : 0.7) + seeded(i + 9) * 0.4) * 100) / 100}s`,
        height: px(10 + seeded(i + 13) * 16),
      })),
    [count, heavy],
  );

  if (reduceMotion) {
    return (
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(100,180,220,0.12))]" />
    );
  }

  return (
    <>
      {drops.map((d) => (
        <span
          key={d.id}
          className="scene-raindrop absolute top-[-20px] w-px rounded-full bg-sky-100/50"
          style={{
            left: d.left,
            height: d.height,
            ["--dur" as string]: d.duration,
            ["--delay" as string]: d.delay,
          }}
        />
      ))}
    </>
  );
}

function Snow({
  reduceMotion,
  light,
}: {
  reduceMotion: boolean;
  light?: boolean;
}) {
  const count = light ? 12 : 28;
  const flakes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: pct(seeded(i + 4) * 100),
        size: px(2 + seeded(i + 6) * 4),
        delay: `${Math.round(seeded(i + 8) * 500) / 100}s`,
        duration: `${Math.round((6 + seeded(i + 10) * 8) * 100) / 100}s`,
        drift: `${Math.round((seeded(i + 12) - 0.5) * 8000) / 100}px`,
      })),
    [count],
  );

  if (reduceMotion) {
    return (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_50%)]" />
    );
  }

  return (
    <>
      {flakes.map((f) => (
        <span
          key={f.id}
          className="scene-snowflake absolute top-[-10px] rounded-full bg-white/90"
          style={{
            left: f.left,
            width: f.size,
            height: f.size,
            ["--dur" as string]: f.duration,
            ["--delay" as string]: f.delay,
            ["--drift" as string]: f.drift,
          }}
        />
      ))}
    </>
  );
}

function Fog({ reduceMotion }: { reduceMotion: boolean }) {
  const layers = reduceMotion ? [0, 1] : [0, 1, 2];

  if (reduceMotion) {
    return (
      <>
        {layers.map((i) => (
          <div
            key={i}
            className="absolute inset-x-[-20%] h-1/3 rounded-full opacity-40"
            style={{
              top: `${20 + i * 22}%`,
              background:
                "radial-gradient(ellipse, rgba(255,255,255,0.35) 0%, transparent 70%)",
            }}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {layers.map((i) => (
        <motion.div
          key={i}
          className="absolute inset-x-[-20%] h-1/3 rounded-full bg-white/25 blur-3xl"
          style={{ top: `${20 + i * 22}%` }}
          animate={{
            x: ["-8%", "8%", "-8%"],
            opacity: [0.25 + i * 0.08, 0.45 + i * 0.08, 0.25 + i * 0.08],
          }}
          transition={{
            duration: 12 + i * 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1.2,
          }}
        />
      ))}
    </>
  );
}

function Lightning({ reduceMotion }: { reduceMotion: boolean }) {
  if (reduceMotion) return null;

  return (
    <motion.div
      className="absolute inset-0 bg-violet-100/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0, 0, 0.55, 0, 0.3, 0, 0, 0, 0] }}
      transition={{
        duration: 7,
        repeat: Infinity,
        ease: "easeInOut",
        times: [0, 0.4, 0.55, 0.57, 0.6, 0.63, 0.66, 0.8, 0.9, 1],
      }}
    />
  );
}

function GoldenParticles({ reduceMotion }: { reduceMotion: boolean }) {
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: pct(20 + seeded(i + 21) * 60),
        top: pct(10 + seeded(i + 25) * 50),
        size: px(2 + seeded(i + 29) * 3),
        delay: `${Math.round(seeded(i + 33) * 300) / 100}s`,
        duration: `${Math.round((4 + seeded(i + 33) * 2) * 100) / 100}s`,
      })),
    [],
  );

  if (reduceMotion) return null;

  return (
    <>
      {particles.map((p) => (
        <span
          key={p.id}
          className="scene-spark absolute rounded-full bg-amber-200/70"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            ["--dur" as string]: p.duration,
            ["--delay" as string]: p.delay,
          }}
        />
      ))}
    </>
  );
}
