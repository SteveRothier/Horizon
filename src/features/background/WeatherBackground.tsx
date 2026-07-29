"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
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
  const reduceMotionHook = useReducedMotion();
  // Until mounted, assume reduced motion so SSR markup stays simple/static
  const reduceMotion = !mounted || !!reduceMotionHook;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      <GradientLayer condition={condition} period={period} />
      <GlowOrbs reduceMotion={reduceMotion} />

      {/* Decorative layers only after hydration to avoid Framer/float mismatches */}
      {mounted ? (
        <>
          {(condition === "clear" || condition === "cloudy") &&
          period === "day" ? (
            <SunHalo
              reduceMotion={reduceMotion}
              intense={condition === "clear"}
            />
          ) : null}

          {period === "night" && condition !== "storm" ? (
            <NightSky reduceMotion={reduceMotion} />
          ) : null}

          {(condition === "cloudy" ||
            condition === "rain" ||
            condition === "storm" ||
            condition === "snow" ||
            (condition === "clear" && period === "day")) && (
            <Clouds
              reduceMotion={reduceMotion}
              density={
                condition === "storm"
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
            <Rain reduceMotion={reduceMotion} heavy={condition === "storm"} />
          ) : null}

          {condition === "storm" ? (
            <Lightning reduceMotion={reduceMotion} />
          ) : null}

          {condition === "snow" ? (
            <Snow reduceMotion={reduceMotion} />
          ) : null}

          {condition === "fog" ? <Fog reduceMotion={reduceMotion} /> : null}

          {condition === "clear" && period === "day" ? (
            <GoldenParticles reduceMotion={reduceMotion} />
          ) : null}
        </>
      ) : null}

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.25)_100%)]" />
    </div>
  );
}

function GradientLayer({
  condition,
  period,
}: {
  condition: WeatherCondition;
  period: DayPeriod;
}) {
  return (
    <motion.div
      key={`${condition}-${period}`}
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: `linear-gradient(145deg, var(--scene-from) 0%, var(--scene-via) 48%, var(--scene-to) 100%)`,
      }}
    />
  );
}

function GlowOrbs({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <>
      <motion.div
        className="absolute -left-1/4 top-0 h-[60vmax] w-[60vmax] rounded-full blur-3xl"
        style={{ background: "var(--scene-glow)" }}
        animate={
          reduceMotion
            ? { opacity: 0.55 }
            : { opacity: [0.45, 0.7, 0.45], scale: [1, 1.06, 1] }
        }
        transition={
          reduceMotion
            ? undefined
            : { duration: 10, repeat: Infinity, ease: "easeInOut" }
        }
      />
      <motion.div
        className="absolute -right-1/4 bottom-0 h-[50vmax] w-[50vmax] rounded-full blur-3xl"
        style={{ background: "var(--scene-glow)" }}
        animate={
          reduceMotion
            ? { opacity: 0.35 }
            : { opacity: [0.3, 0.5, 0.3], scale: [1, 1.08, 1] }
        }
        transition={
          reduceMotion
            ? undefined
            : { duration: 14, repeat: Infinity, ease: "easeInOut", delay: 1.5 }
        }
      />
    </>
  );
}

function SunHalo({
  reduceMotion,
  intense,
}: {
  reduceMotion: boolean;
  intense: boolean;
}) {
  return (
    <div className="absolute right-[8%] top-[6%] sm:right-[12%] sm:top-[8%]">
      <motion.div
        className="relative"
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={
          reduceMotion
            ? undefined
            : { duration: 80, repeat: Infinity, ease: "linear" }
        }
      >
        {/* Rays */}
        <div
          className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full",
            intense ? "h-56 w-56 sm:h-72 sm:w-72" : "h-40 w-40 sm:h-52 sm:w-52",
          )}
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(255,220,120,0.15) 8deg, transparent 16deg, rgba(255,220,120,0.12) 24deg, transparent 32deg)",
            maskImage:
              "radial-gradient(circle, transparent 28%, black 30%, black 55%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(circle, transparent 28%, black 30%, black 55%, transparent 70%)",
          }}
        />
      </motion.div>
      <motion.div
        className={cn(
          "rounded-full bg-amber-100 shadow-[0_0_60px_20px_rgba(255,210,100,0.45)]",
          intense ? "h-16 w-16 sm:h-20 sm:w-20" : "h-10 w-10 sm:h-12 sm:w-12",
        )}
        animate={
          reduceMotion
            ? { opacity: 0.95 }
            : { opacity: [0.85, 1, 0.85], scale: [1, 1.04, 1] }
        }
        transition={
          reduceMotion
            ? undefined
            : { duration: 5, repeat: Infinity, ease: "easeInOut" }
        }
      />
    </div>
  );
}

function NightSky({ reduceMotion }: { reduceMotion: boolean }) {
  const stars = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        left: pct(seeded(i + 1) * 100),
        top: pct(seeded(i + 40) * 70),
        size: px(1 + seeded(i + 80) * 2),
        delay: `${Math.round(seeded(i + 120) * 400) / 100}s`,
        duration: `${Math.round((2 + seeded(i + 160) * 3) * 100) / 100}s`,
      })),
    [],
  );

  return (
    <>
      <motion.div
        className="absolute right-[10%] top-[8%] h-14 w-14 rounded-full bg-slate-100 shadow-[0_0_40px_12px_rgba(200,220,255,0.25)] sm:h-16 sm:w-16"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 0.9, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute left-2 top-1 h-10 w-10 rounded-full bg-[var(--scene-via)] opacity-40 blur-[1px]" />
      </motion.div>

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
}: {
  reduceMotion: boolean;
  heavy: boolean;
}) {
  const drops = useMemo(
    () =>
      Array.from({ length: heavy ? 48 : 32 }, (_, i) => ({
        id: i,
        left: pct(seeded(i + 3) * 100),
        delay: `${Math.round(seeded(i + 7) * 150) / 100}s`,
        duration: `${Math.round(((heavy ? 0.45 : 0.7) + seeded(i + 9) * 0.4) * 100) / 100}s`,
        height: px(10 + seeded(i + 13) * 16),
      })),
    [heavy],
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

function Snow({ reduceMotion }: { reduceMotion: boolean }) {
  const flakes = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: pct(seeded(i + 4) * 100),
        size: px(2 + seeded(i + 6) * 4),
        delay: `${Math.round(seeded(i + 8) * 500) / 100}s`,
        duration: `${Math.round((6 + seeded(i + 10) * 8) * 100) / 100}s`,
        drift: `${Math.round((seeded(i + 12) - 0.5) * 8000) / 100}px`,
      })),
    [],
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
  const layers = [0, 1, 2];

  return (
    <>
      {layers.map((i) => (
        <motion.div
          key={i}
          className="absolute inset-x-[-20%] h-1/3 rounded-full bg-white/25 blur-3xl"
          style={{ top: `${20 + i * 22}%` }}
          animate={
            reduceMotion
              ? { opacity: 0.35 + i * 0.1 }
              : {
                  x: ["-8%", "8%", "-8%"],
                  opacity: [0.25 + i * 0.08, 0.45 + i * 0.08, 0.25 + i * 0.08],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : {
                  duration: 12 + i * 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 1.2,
                }
          }
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
