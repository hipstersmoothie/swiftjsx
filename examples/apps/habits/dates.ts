// Calendar days, weeks and months, in the user's time zone and locale.
//
// History is keyed by *calendar day* ("2026-10-27"), not by timestamp: a day
// stays the same day across DST changes and when you travel, and day math
// goes through date-fns (addDays, differenceInCalendarDays), never through
// 86,400,000 ms (a DST day is 23 or 25 hours long).
import {
  addDays, differenceInCalendarDays, eachDayOfInterval, endOfMonth, isValid, startOfMonth, startOfToday, startOfWeek, type Day,
} from "date-fns";
import { format, useEnvironment, useToday } from "swiftjsx";

/** A calendar day, "yyyy-MM-dd". */
export type DayKey = string;

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

/**
 * The local calendar day of a date. Built by hand rather than with
 * date-fns' format(): the week strip and heatmap make thousands of keys per
 * render, and JavaScriptCore runs without a JIT on iOS.
 */
export function dayKey(date: Date | number): DayKey {
  const d = typeof date === "number" ? new Date(date) : date;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local midnight of a day key (or 1:00 where midnight doesn't exist that day). */
export function parseDay(key: DayKey): Date {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return isValid(date) ? date : startOfToday();
}

export const addDayKeys = (key: DayKey, days: number): DayKey => dayKey(addDays(parseDay(key), days));
export const daysBetween = (from: DayKey, to: DayKey) => differenceInCalendarDays(parseDay(to), parseDay(from));

/** Every day from `from` to `to`, inclusive (empty when from > to). */
export function dayRange(from: DayKey, to: DayKey): DayKey[] {
  if (from > to) return [];
  return eachDayOfInterval({ start: parseDay(from), end: parseDay(to) }).map(dayKey);
}

// MARK: Locale

/** The user's locale, from the system's preferred languages ("en-US", "de-DE"…). */
export const locale: string = (() => {
  try {
    const tag = navigator.language || "en-US";
    // Throws on tags Intl doesn't accept.
    return new Intl.Locale(tag).toString();
  } catch {
    return "en-US";
  }
})();

/** The first day of the week (0 = Sunday), from the user's settings: pass it to the week helpers. */
export const useWeekStartsOn = (): Day => useEnvironment().locale.weekStartsOn;

export const weekStart = (date: Date | number, weekStartsOn: Day) => startOfWeek(date, { weekStartsOn });
export const weekStartKey = (key: DayKey, weekStartsOn: Day) => dayKey(weekStart(parseDay(key), weekStartsOn));

/** The 7 days of the week containing `key`, in locale order. */
export function weekDays(key: DayKey, weekStartsOn: Day): DayKey[] {
  const start = weekStart(parseDay(key), weekStartsOn);
  return Array.from({ length: 7 }, (_, i) => dayKey(addDays(start, i)));
}

/** 0 = Sunday … 6 = Saturday, in the locale's order (Mon…Sun in Germany). */
export const orderedWeekdays = (weekStartsOn: Day): number[] => Array.from({ length: 7 }, (_, i) => (weekStartsOn + i) % 7);

/** The month grid around `month`: always 6 rows of 7, so pages line up. */
export function monthGrid(month: Date, weekStartsOn: Day): DayKey[][] {
  const first = weekStart(startOfMonth(month), weekStartsOn);
  return Array.from({ length: 6 }, (_, row) => Array.from({ length: 7 }, (_, col) => dayKey(addDays(first, row * 7 + col))));
}

export const isInMonth = (key: DayKey, month: Date) => key.slice(0, 7) === dayKey(month).slice(0, 7);
export const monthEnd = (month: Date) => dayKey(endOfMonth(month));

// MARK: Formatting (Intl, so names follow the locale)

// A fixed Sunday to name weekdays from (0 = Sunday).
const SUNDAY = new Date(2024, 0, 7);
const weekdayFormat = (style: "narrow" | "short" | "long") => new Intl.DateTimeFormat(locale, { weekday: style });
const narrow = weekdayFormat("narrow");
const short = weekdayFormat("short");
const long = weekdayFormat("long");

export const weekdayName = (day: number, style: "narrow" | "short" | "long" = "short") =>
  (style === "narrow" ? narrow : style === "short" ? short : long).format(addDays(SUNDAY, day));

const monthYear = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
const monthShort = new Intl.DateTimeFormat(locale, { month: "short" });
const dayMonth = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });
const fullDay = new Intl.DateTimeFormat(locale, { weekday: "long", month: "long", day: "numeric" });
const time = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" });

export const formatMonthYear = (date: Date) => monthYear.format(date);
export const formatMonthShort = (date: Date) => monthShort.format(date);
export const formatDayMonth = (key: DayKey) => dayMonth.format(parseDay(key));
export const formatFullDay = (key: DayKey) => fullDay.format(parseDay(key));
export const formatTime = (hour: number, minute: number) => time.format(new Date(2024, 0, 1, hour, minute));

/** "Oct 6 – 12", or "Sep 29 – Oct 5" (Intl's range format, so it reads right in every locale). */
export function formatWeekRange(startKey: DayKey): string {
  const start = parseDay(startKey);
  const end = addDays(start, 6);
  const ranged = dayMonth as Intl.DateTimeFormat & { formatRange?: (a: Date, b: Date) => string };
  if (ranged.formatRange) return ranged.formatRange(start, end);
  return `${dayMonth.format(start)} – ${dayMonth.format(end)}`;
}

/** "Today", "Yesterday", a weekday within the past week, else "Oct 6". */
export const relativeDay = (key: DayKey, today: DayKey) => format.relativeDay(parseDay(key), { now: +parseDay(today) });

// MARK: Today, kept current

/** Today's day key, updated at midnight (and when the time zone changes). */
export const useTodayKey = (): DayKey => dayKey(useToday());
