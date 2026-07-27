"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useT } from "@/hooks/useT";
import { cn } from "@/utils/cn";

type ErrorCardProps = {
  message: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorCard({ message, onRetry, className }: ErrorCardProps) {
  const t = useT();

  return (
    <GlassCard
      interactive={false}
      className={cn(
        "flex h-full min-h-0 flex-col items-center justify-center gap-3 border-[var(--surface-error-border)] bg-[var(--surface-error)] p-[var(--card-pad)] text-center",
        className,
      )}
      role="alert"
    >
      <AlertCircle className="h-6 w-6 text-red-200" aria-hidden />
      <p className="max-w-sm text-sm text-[var(--text-primary)]">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="glass glass-sm inline-flex items-center gap-2 px-3 py-1.5 text-sm"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          {t("error.retry")}
        </button>
      ) : null}
    </GlassCard>
  );
}
