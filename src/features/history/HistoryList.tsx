"use client";

import { Clock, X } from "lucide-react";
import { useT } from "@/hooks/useT";
import { useHistoryStore } from "@/stores/historyStore";
import { selectLocation } from "@/utils/selectLocation";
import { cn } from "@/utils/cn";

type HistoryListProps = {
  className?: string;
  onSelect?: () => void;
};

export function HistoryList({ className, onSelect }: HistoryListProps) {
  const t = useT();
  const items = useHistoryStore((s) => s.items);
  const removeFromHistory = useHistoryStore((s) => s.removeFromHistory);
  const clearHistory = useHistoryStore((s) => s.clearHistory);

  if (items.length === 0) {
    return (
      <p className={cn("px-2 text-xs text-[var(--text-muted)]", className)}>
        {t("sidebar.noRecent")}
      </p>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      <ul className="space-y-0.5">
        {items.map((loc) => (
          <li key={loc.id} className="group flex items-center gap-0.5">
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2 rounded-[var(--glass-radius-sm)] px-2 py-1.5 text-left text-xs text-[var(--text-secondary)] transition-colors hover:bg-white/10 hover:text-[var(--text-primary)]"
              onClick={() => {
                selectLocation(loc);
                onSelect?.();
              }}
            >
              <Clock className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
              <span className="truncate">{loc.name}</span>
            </button>
            <button
              type="button"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] opacity-70 transition-opacity hover:bg-white/10 hover:text-[var(--text-primary)] hover:opacity-100 group-hover:opacity-100 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
              aria-label={t("history.removeNamed", { name: loc.name })}
              onClick={() => removeFromHistory(loc.id)}
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="px-2 text-[0.65rem] text-[var(--text-muted)] underline-offset-2 hover:text-[var(--text-secondary)] hover:underline"
        onClick={() => clearHistory()}
      >
        {t("sidebar.clearHistory")}
      </button>
    </div>
  );
}
