"use client";

import { useCallback } from "react";
import { translate, type MessageKey } from "@/i18n/messages";
import { useSettingsStore } from "@/stores/settingsStore";

export function useT() {
  const locale = useSettingsStore((s) => s.locale);

  return useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
    [locale],
  );
}

export function useLocale() {
  return useSettingsStore((s) => s.locale);
}
