// Calendar days, weeks and months, in the user's time zone and locale.
//
// History is keyed by *calendar day* ("2026-10-27"), not by timestamp: a day
// stays the same day across DST changes and when you travel, and day math
// goes through date-fns (addDays, differenceInCalendarDays), never through
// 86,400,000 ms (a DST day is 23 or 25 hours long).
import { useSyncExternalStore } from "react";
import {
  addDays, differenceInCalendarDays, eachDayOfInterval, endOfMonth, endOfWeek, format, isValid, startOfMonth,
  startOfToday, startOfTomorrow, startOfWeek, type Day,
} from "date-fns";

/** A calendar day, "yyyy-MM-dd". */
export type DayKey = string;

export const dayKey = (date: Date | number): DayKey => format(date, "yyyy-MM-dd");

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

// Regions whose week starts on Sunday (CLDR), for engines without weekInfo.
const SUNDAY_REGIONS = new Set([
  "US", "CA", "MX", "BR", "JP", "KR", "TW", "HK", "MO", "CN", "IL", "IN", "PH", "TH", "ZA", "AU", "NZ", "SA", "AR", "CO",
  "PE", "VE", "GT", "HN", "NI", "PA", "PR", "DO", "SV", "PY", "BO", "EC", "ID", "KE", "ET", "ZW", "BW", "PK", "BD", "NP",
]);
const SATURDAY_REGIONS = new Set(["AE", "AF", "BH", "DJ", "DZ", "EG", "IQ", "IR", "JO", "KW", "LY", "OM", "QA", "SD", "SY"]);

/**
 * First day of the week for the locale, as date-fns counts (0 = Sunday).
 * Intl.Locale's week info (getWeekInfo(), or the older weekInfo getter) when
 * the engine has it, else CLDR's regions.
 */
export const weekStartsOn: Day = (() => {
  try {
    const loc = new Intl.Locale(locale) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number };
      weekInfo?: { firstDay: number };
      maximize(): Intl.Locale;
    };
    const info = loc.getWeekInfo?.() ?? loc.weekInfo;
    // Intl counts 1 = Monday … 7 = Sunday.
    if (info && info.firstDay >= 1 && info.firstDay <= 7) return (info.firstDay % 7) as Day;
    const region = loc.region ?? loc.maximize().region ?? "US";
    return SUNDAY_REGIONS.has(region) ? 0 : SATURDAY_REGIONS.has(region) ? 6 : 1;
  } catch {
    return 0;
  }
})();

const weekOptions = { weekStartsOn };
export const weekStart = (date: Date | number) => startOfWeek(date, weekOptions);
export const weekEnd = (date: Date | number) => endOfWeek(date, weekOptions);
export const weekStartKey = (key: DayKey) => dayKey(weekStart(parseDay(key)));

/** The 7 days of the week containing `key`, in locale order. */
export function weekDays(key: DayKey): DayKey[] {
  const start = weekStart(parseDay(key));
  return Array.from({ length: 7 }, (_, i) => dayKey(addDays(start, i)));
}

/** 0 = Sunday … 6 = Saturday, in the locale's order (Mon…Sun in Germany). */
export const orderedWeekdays: number[] = Array.from({ length: 7 }, (_, i) => (weekStartsOn + i) % 7);

/** The month grid around `month`: always 6 rows of 7, so pages line up. */
export function monthGrid(month: Date): DayKey[][] {
  const first = weekStart(startOfMonth(month));
  return Array.from({ length: 6 }, (_, row) => Array.from({ length: 7 }, (_, col) => dayKey(addDays(first, row * 7 + col))));
}

export const isInMonth = (key: DayKey, month: Date) => key.slice(0, 7) === format(month, "yyyy-MM");
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
const mediumDay = new Intl.DateTimeFormat(locale, { weekday: "short", month: "short", day: "numeric" });
const time = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" });

export const formatMonthYear = (date: Date) => monthYear.format(date);
export const formatMonthShort = (date: Date) => monthShort.format(date);
export const formatDayMonth = (key: DayKey) => dayMonth.format(parseDay(key));
export const formatFullDay = (key: DayKey) => fullDay.format(parseDay(key));
export const formatMediumDay = (key: DayKey) => mediumDay.format(parseDay(key));
export const formatTime = (hour: number, minute: number) => time.format(new Date(2024, 0, 1, hour, minute));

/** "Oct 6 – 12", or "Sep 29 – Oct 5". */
export function formatWeekRange(startKey: DayKey): string {
  const start = parseDay(startKey);
  const end = addDays(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  return `${dayMonth.format(start)} – ${sameMonth ? end.getDate() : dayMonth.format(end)}`;
}

/** "Today", "Yesterday", or a weekday and date. */
export function relativeDay(key: DayKey, today: DayKey): string {
  const diff = daysBetween(key, today);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff === -1) return "Tomorrow";
  return formatMediumDay(key);
}

// MARK: Today, kept current

// The snapshot is a string, so recomputing it on every read is fine. React
// re-reads it just after midnight and when the app comes back to the
// foreground (the time zone may have changed while it was away).
function subscribe(onChange: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    timer = setTimeout(() => {
      onChange();
      schedule();
    }, startOfTomorrow().getTime() - Date.now() + 1000);
  };
  schedule();
  const wake = () => {
    clearTimeout(timer);
    onChange();
    schedule();
  };
  addEventListener("visibilitychange", wake);
  addEventListener("focus", wake);
  return () => {
    clearTimeout(timer);
    removeEventListener("visibilitychange", wake);
    removeEventListener("focus", wake);
  };
}

/** Today's day key, updated at midnight. */
export const useToday = (): DayKey => useSyncExternalStore(subscribe, () => dayKey(Date.now()));
