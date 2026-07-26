"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { SemiGauge } from "@/components/ui/SemiGauge";
import { cn } from "@/utils/cn";

type UVIndexProps = {
  value: number | null;
  className?: string;
};

function uvMeta(uv: number): { label: string; advice: string; color: string } {
  if (uv < 3) {
    return {
      label: "Faible",
      advice: "Protection minimale nécessaire.",
      color: "#7ddea2",
    };
  }
  if (uv < 6) {
    return {
      label: "Modéré",
      advice: "Lunettes de soleil et crème solaire recommandées.",
      color: "#f5c542",
    };
  }
  if (uv < 8) {
    return {
      label: "Élevé",
      advice: "Évitez le soleil aux heures critiques.",
      color: "#ff9a4a",
    };
  }
  if (uv < 11) {
    return {
      label: "Très élevé",
      advice: "Protection maximale indispensable.",
      color: "#f07178",
    };
  }
  return {
    label: "Extrême",
    advice: "Restez à l’ombre autant que possible.",
    color: "#c084fc",
  };
}

export function UVIndex({ value, className }: UVIndexProps) {
  const uv = value ?? 0;
  const meta = uvMeta(uv);

  return (
    <GlassCard
      interactive={false}
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden p-[var(--card-pad)]",
        className,
      )}
    >
      <h2 className="mb-1 shrink-0 text-sm font-medium text-[var(--text-secondary)]">
        Indice UV
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
