// What the kit's `format` doesn't cover: Health-style "7 hr 12 min",
// running pace, times and date ranges in the Health app's wording.
import { format, isSameDay, isSameMonth, isSameYear } from "date-fns";
import { format as fmt } from "swiftjsx";

/** 12345.6 → "12,346". */
export const int = (n: number) => fmt.number(n, { maximumFractionDigits: 0 });

/** 2.5 → "2.50" (with `digits` = 2). */
export const decimal = (n: number, digits = 1) => fmt.number(n, { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** 432 minutes → "7 hr 12 min". */
export function hoursMinutes(minutes: number) {
  const m = Math.round(minutes);
  const h = Math.floor(m / 60);
  if (!h) return `${m % 60} min`;
  return m % 60 ? `${h} hr ${m % 60} min` : `${h} hr`;
}

/** Seconds per km → `5'32"`. */
export function pace(secondsPerKm: number) {
  const s = Math.round(secondsPerKm);
  return `${Math.floor(s / 60)}'${(s % 60).toString().padStart(2, "0")}"`;
}

export function time(date: Date) {
  return format(date, "h:mm a");
}

/** "Oct 21 – 27, 2026", "Sep 28 – Oct 27, 2026", "Today". */
export function dateRange(from: Date, to: Date, today: Date) {
  if (isSameDay(from, to)) return isSameDay(from, today) ? "Today" : format(from, "EEE, MMM d, yyyy");
  if (isSameMonth(from, to)) return `${format(from, "MMM d")} – ${format(to, "d, yyyy")}`;
  if (isSameYear(from, to)) return `${format(from, "MMM d")} – ${format(to, "MMM d, yyyy")}`;
  return `${format(from, "MMM d, yyyy")} – ${format(to, "MMM d, yyyy")}`;
}

export function percentChange(current: number, previous: number) {
  if (!previous) return 0;
  return Math.round(((current - previous) / previous) * 100);
}
