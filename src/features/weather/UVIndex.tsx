"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { SemiGauge } from "@/components/ui/SemiGauge";
import { useT } from "@/hooks/useT";
import type { MessageKey } from "@/i18n/messages";
import {
  dashboardCardClass,
  dashboardCardTitleClass,
} from "@/constants/layout";
import { cn } from "@/utils/cn";

type UVIndexProps = {
  value: number | null;
  className?: string;
};

function uvMeta(
  uv: number,
  t: (key: MessageKey) => string,
): { label: string; advice: string; color: string } {
  // WHO scale on integer UV: 0–2 low, 3–5 mod, 6–7 high, 8–10 very high, 11+ extreme
  if (uv <= 2) {
    return {
      label: t("uv.low"),
      advice: t("uv.advice.low"),
      color: "#7ddea2",
    };
  }
  if (uv <= 5) {
    return {
      label: t("uv.moderate"),
      advice: t("uv.advice.moderate"),
      color: "#f5c542",
    };
  }
  if (uv <= 7) {
    return {
      label: t("uv.high"),
      advice: t("uv.advice.high"),
      color: "#ff9a4a",
    };
  }
  if (uv <= 10) {
    return {
      label: t("uv.veryHigh"),
      advice: t("uv.advice.veryHigh"),
      color: "#f07178",
    };
  }
  return {
    label: t("uv.extreme"),
    advice: t("uv.advice.extreme"),
    color: "#c084fc",
  };
}

export function UVIndex({ value, className }: UVIndexProps) {
  const t = useT();
  const uv = Math.round(value ?? 0);
  const meta = uvMeta(uv, t);

  return (
    <GlassCard
      interactive={false}
      className={cn(dashboardCardClass, className)}
    >
      <h2 className={dashboardCardTitleClass}>
        {t("uv.title")}
      </h2>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <SemiGauge
          value={uv}
          max={11}
          label={meta.label}
          sublabel={meta.advice}
          color={meta.color}
          className="w-28 sm:w-32"
        />
      </div>
    </GlassCard>
  );
}
