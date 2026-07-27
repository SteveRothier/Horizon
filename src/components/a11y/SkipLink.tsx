"use client";

import { useT } from "@/hooks/useT";

/** Accessible skip link — localized via settings store. */
export function SkipLink() {
  const t = useT();

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:text-zinc-900"
    >
      {t("skip.content")}
    </a>
  );
}
