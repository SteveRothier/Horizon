import type { AppLocale } from "@/stores/settingsStore";
import { translate } from "@/i18n/messages";

const BCP47: Record<AppLocale, string> = {
  fr: "fr-FR",
  en: "en-US",
};

const DAY_SHORT_KEYS = [
  "day.sun.short",
  "day.mon.short",
  "day.tue.short",
  "day.wed.short",
  "day.thu.short",
  "day.fri.short",
  "day.sat.short",
] as const;

const DAY_LONG_KEYS = [
  "day.sun.long",
  "day.mon.long",
  "day.tue.long",
  "day.wed.long",
  "day.thu.long",
  "day.fri.long",
  "day.sat.long",
] as const;

const WIND_KEYS = [
  "wind.N",
  "wind.NE",
  "wind.E",
  "wind.SE",
  "wind.S",
  "wind.SW",
  "wind.W",
  "wind.NW",
] as const;

export function formatHour(iso: string, locale: AppLocale = "fr"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(11, 16);
  return d.toLocaleTimeString(BCP47[locale], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDayShort(
  isoDate: string,
  locale: AppLocale = "fr",
): string {
  const d = new Date(isoDate.includes("T") ? isoDate : `${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate.slice(5);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return translate(locale, "format.today");
  }
  return translate(locale, DAY_SHORT_KEYS[d.getDay()]);
}

export function formatDayLong(
  isoDate: string,
  locale: AppLocale = "fr",
): string {
  const d = new Date(isoDate.includes("T") ? isoDate : `${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return translate(locale, DAY_LONG_KEYS[d.getDay()]);
}

export function formatTimeShort(
  iso: string | null,
  locale: AppLocale = "fr",
): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const m = iso.match(/T(\d{2}:\d{2})/);
    return m?.[1] ?? "—";
  }
  return d.toLocaleTimeString(BCP47[locale], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function windDirectionLabel(
  deg: number,
  locale: AppLocale = "fr",
): string {
  const i = Math.round(deg / 45) % 8;
  return translate(locale, WIND_KEYS[i]);
}
