"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settingsStore";

/** Keep <html lang> in sync with the persisted locale setting. */
export function DocumentLang() {
  const locale = useSettingsStore((s) => s.locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
