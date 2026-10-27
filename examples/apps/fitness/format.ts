import { format, isSameDay, isSameMonth, isSameYear, differenceInCalendarDays } from "date-fns";

/** 12345 → "12,345" (no Intl needed). */
export function int(n: number) {
  const s = Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return n < 0 ? `-${s}` : s;
}

export function decimal(n: number, digits = 1) {
  return n.toFixed(digits);
}

/** Axis labels: 12000 → "12K", 7.5 → "7.5". */
export function compact(n: number) {
  if (Math.abs(n) >= 10_000) return `${Math.round(n / 1000)}K`;
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return Number.isInteger(n) ? `${n}` : n.toFixed(1);
}

/** 432 minutes → "7 hr 12 min". */
export function hoursMinutes(minutes: number) {
  const m = Math.round(minutes);
  const h = Math.floor(m / 60);
  if (!h) return `${m % 60} min`;
  return m % 60 ? `${h} hr ${m % 60} min` : `${h} hr`;
}

/** Seconds → "0:42:13" or "42:13". */
export function clock(seconds: number) {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (x: number) => x.toString().padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
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

/** "Today", "Yesterday", "Tuesday", "Oct 12". */
export function relativeDay(date: Date, today: Date) {
  const days = differenceInCalendarDays(today, date);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return format(date, "EEEE");
  return format(date, isSameYear(date, today) ? "MMM d" : "MMM d, yyyy");
}

export function percentChange(current: number, previous: number) {
  if (!previous) return 0;
  return Math.round(((current - previous) / previous) * 100);
}
