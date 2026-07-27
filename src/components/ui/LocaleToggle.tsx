"use client";

import { useSettingsStore } from "@/stores/settingsStore";
import { cn } from "@/utils/cn";

/**
 * Segmented FR / EN locale control (strings wired in i18n phase).
 */
export function LocaleToggle({ className }: { className?: string }) {
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);

  return (
    <div
      role="group"
      aria-label="Langue"
      className={cn(
        "glass flex h-9 shrink-0 items-center rounded-full p-0.5 sm:h-10",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setLocale("fr")}
        aria-pressed={locale === "fr"}
        className={cn(
          "h-full rounded-full px-2.5 text-xs font-semibold tracking-wide transition-colors sm:px-3 sm:text-sm",
          locale === "fr"
            ? "bg-white/20 text-[var(--text-primary)]"
            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
        )}
      >
        FR
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={cn(
          "h-full rounded-full px-2.5 text-xs font-semibold tracking-wide transition-colors sm:px-3 sm:text-sm",
          locale === "en"
            ? "bg-white/20 text-[var(--text-primary)]"
            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
        )}
      >
        EN
      </button>
    </div>
  );
}
