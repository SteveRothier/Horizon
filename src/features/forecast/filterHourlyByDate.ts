import type { HourlyForecastItem } from "@/types/weather";

/** Extract YYYY-MM-DD from an hourly ISO timestamp (local wall time from API). */
export function dateKeyFromTime(iso: string): string {
  if (iso.length >= 10 && iso[4] === "-" && iso[7] === "-") {
    return iso.slice(0, 10);
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type FilterHourlyOptions = {
  /** When selected date is today, drop hours before now. Default true. */
  fromNowIfToday?: boolean;
  /** Today’s YYYY-MM-DD (usually daily[0].date). */
  todayDate?: string;
  now?: Date;
};

/** Keep hourly slots that belong to `dateYmd` (calendar day). */
export function filterHourlyByDate(
  hourly: HourlyForecastItem[],
  dateYmd: string,
  options: FilterHourlyOptions = {},
): HourlyForecastItem[] {
  const { fromNowIfToday = true, todayDate, now = new Date() } = options;
  const isToday = Boolean(todayDate && dateYmd === todayDate);
  const cutoff = fromNowIfToday && isToday ? now.getTime() - 30 * 60 * 1000 : null;

  return hourly.filter((item) => {
    if (dateKeyFromTime(item.time) !== dateYmd) return false;
    if (cutoff == null) return true;
    const t = new Date(item.time).getTime();
    if (Number.isNaN(t)) return true;
    return t >= cutoff;
  });
}
