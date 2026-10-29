// Things nearly every app writes for itself: the current time and day,
// debouncing, the app's lifecycle state, state saved across launches, and
// number / date / duration formatting.

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const g = globalThis as any;
const on = (type: string, fn: () => void) => {
  g.addEventListener?.(type, fn);
  return () => g.removeEventListener?.(type, fn);
};

// MARK: Time

type Ticker = { listeners: Set<() => void>; timer: ReturnType<typeof setInterval> | null; now: number };
const tickers = new Map<number, Ticker>();

/** One shared timer per interval, refreshed when the app comes back or the clock changes. */
function ticker(ms: number): Ticker {
  let t = tickers.get(ms);
  if (!t) {
    t = { listeners: new Set(), timer: null, now: Date.now() };
    tickers.set(ms, t);
  }
  return t;
}

function subscribe(ms: number, listener: () => void) {
  const t = ticker(ms);
  const refresh = () => {
    t.now = Date.now();
    t.listeners.forEach((l) => l());
  };
  if (t.listeners.size === 0) {
    t.now = Date.now();
    t.timer = setInterval(refresh, ms);
  }
  t.listeners.add(listener);
  const offs = [on("focus", refresh), on("pageshow", refresh), on("timechange", refresh)];
  return () => {
    offs.forEach((off) => off());
    t.listeners.delete(listener);
    if (t.listeners.size === 0 && t.timer) {
      clearInterval(t.timer);
      t.timer = null;
    }
  };
}

const every = (interval: "second" | "minute" | number) => (interval === "second" ? 1000 : interval === "minute" ? 60_000 : interval);

/**
 * The current time (ms), re-rendering every `interval` ("minute" by default)
 * and when the app comes back to the foreground or the clock changes. One
 * timer is shared by every component using the same interval. For text that
 * only shows a time, `<Text date dateStyle>` ticks without re-rendering.
 */
export function useNow(interval: "second" | "minute" | number = "minute"): number {
  const ms = every(interval);
  return useSyncExternalStore(
    (listener) => subscribe(ms, listener),
    () => ticker(ms).now,
  );
}

const startOfDay = (ms: number) => new Date(ms).setHours(0, 0, 0, 0);

let today = startOfDay(Date.now());
const todayListeners = new Set<() => void>();
function checkToday() {
  const now = startOfDay(Date.now());
  if (now === today) return;
  today = now;
  todayListeners.forEach((l) => l());
}

/**
 * The start of today (local time, ms). Changes at midnight, when the time
 * zone or clock changes, and when the app comes back the next day.
 */
export function useToday(): number {
  return useSyncExternalStore(
    (listener) => {
      todayListeners.add(listener);
      const offs = [on("timechange", checkToday), on("focus", checkToday), on("pageshow", checkToday)];
      // Midnight while open: the "timechange" event covers it; this is a fallback.
      const timer = setInterval(checkToday, 60_000);
      return () => {
        todayListeners.delete(listener);
        offs.forEach((off) => off());
        clearInterval(timer);
      };
    },
    () => today,
  );
}

// MARK: Debouncing

/**
 * `value`, once it has stopped changing for `ms` (search fields). The second
 * element is whether a newer value is waiting.
 */
export function useDebouncedValue<T>(value: T, ms = 300): [T, boolean] {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return [settled, !Object.is(settled, value)];
}

/** A function that runs `fn` once calls have stopped for `ms` (with the last arguments). */
export function useDebouncedCallback<A extends unknown[]>(fn: (...args: A) => void, ms = 300): (...args: A) => void {
  const latest = useRef(fn);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    latest.current = fn;
  });
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return (...args: A) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => latest.current(...args), ms);
  };
}

// MARK: App state

export type AppState = "active" | "inactive" | "background";
let appState: AppState = "active";
const appStateListeners = new Set<() => void>();
function setAppState(state: AppState) {
  if (state === appState) return;
  appState = state;
  appStateListeners.forEach((l) => l());
}
on("focus", () => setAppState("active"));
on("blur", () => setAppState(appState === "background" ? "background" : "inactive"));
on("pagehide", () => setAppState("background"));
on("pageshow", () => setAppState("inactive"));

/**
 * "active" (in front, taking input), "inactive" (a notification shade or the
 * app switcher over it), or "background". Save work in a "pagehide" window
 * listener (it gets time to finish) or when this turns "background".
 */
export function useAppState(): AppState {
  return useSyncExternalStore(
    (listener) => {
      appStateListeners.add(listener);
      return () => appStateListeners.delete(listener);
    },
    () => appState,
  );
}

// MARK: Persistent state

const persisted = new Map<string, { value: unknown; listeners: Set<() => void> }>();

function persistedEntry<T>(key: string, initial: T, validate?: (v: unknown) => v is T) {
  let entry = persisted.get(key);
  if (!entry) {
    let value: unknown = initial;
    try {
      const raw = g.localStorage.getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        value = !validate || validate(parsed) ? parsed : initial;
      }
    } catch {
      value = initial;
    }
    entry = { value, listeners: new Set() };
    persisted.set(key, entry);
  }
  return entry as { value: T; listeners: Set<() => void> };
}

/**
 * `useState`, saved under `key` across launches (JSON in localStorage, which
 * writes to disk in the background and flushes when the app leaves the
 * foreground). Components using the same key share the value. `validate`
 * rejects saved data that no longer fits (it falls back to `initial`).
 */
export function usePersistentState<T>(
  key: string,
  initial: T,
  options: { validate?: (value: unknown) => value is T } = {},
): [T, (next: T | ((previous: T) => T)) => void] {
  const entry = persistedEntry(key, initial, options.validate);
  const value = useSyncExternalStore(
    (listener) => {
      entry.listeners.add(listener);
      return () => entry.listeners.delete(listener);
    },
    () => entry.value,
  );
  const set = (next: T | ((previous: T) => T)) => writePersisted(key, next);
  return [value, set];
}

function writePersisted<T>(key: string, next: T | ((previous: T) => T)) {
  const entry = persisted.get(key) as { value: T; listeners: Set<() => void> };
  const resolved = typeof next === "function" ? (next as (p: T) => T)(entry.value) : next;
  if (Object.is(resolved, entry.value)) return;
  entry.value = resolved;
  g.localStorage.setItem(key, JSON.stringify(resolved));
  entry.listeners.forEach((l) => l());
}

// MARK: Formatting

// Intl objects are slow to make without a JIT: one per options, reused.
const cache = new Map<string, unknown>();
function cached<T>(kind: string, options: object, make: () => T): T {
  const key = kind + JSON.stringify(options);
  let value = cache.get(key) as T | undefined;
  if (!value) {
    value = make();
    cache.set(key, value);
  }
  return value;
}
const numberFormat = (options: Intl.NumberFormatOptions) => cached("n", options, () => new Intl.NumberFormat(undefined, options));

const DAY = 86_400_000;

/**
 * Numbers, dates and durations in the user's locale (Intl, with the
 * formatters cached: JavaScriptCore has no JIT on iOS, so making them is
 * slow).
 */
export const format = {
  /** 1,234.5 (any Intl.NumberFormat options). */
  number: (n: number, options: Intl.NumberFormatOptions = {}) => numberFormat(options).format(n),
  /** 1.2K, 3.4M. */
  compact: (n: number) => numberFormat({ notation: "compact", maximumFractionDigits: 1 }).format(n),
  /** 0.42 → 42%. */
  percent: (fraction: number, digits = 0) => numberFormat({ style: "percent", maximumFractionDigits: digits }).format(fraction),
  /** $12.50 (an amount, not cents). */
  currency: (amount: number, currency: string) => numberFormat({ style: "currency", currency }).format(amount),
  /** 1.5 MB (decimal units, as Finder and Settings show sizes). */
  bytes: (bytes: number) => {
    const units = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte"];
    let value = bytes;
    let unit = 0;
    while (Math.abs(value) >= 1000 && unit < units.length - 1) {
      value /= 1000;
      unit++;
    }
    return numberFormat({ style: "unit", unit: units[unit], unitDisplay: "short", maximumFractionDigits: unit === 0 ? 0 : 1 }).format(value);
  },
  /**
   * Seconds as "1:05:09" / "5:09" ("positional", default), "1h 5m"
   * ("short"), or "1 hour, 5 minutes" ("long").
   */
  duration: (seconds: number, style: "positional" | "short" | "long" = "positional") => {
    const sign = seconds < 0 ? "-" : "";
    const total = Math.round(Math.abs(seconds));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (style === "positional") {
      const pad = (v: number) => String(v).padStart(2, "0");
      return sign + (h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`);
    }
    const parts: [number, string][] = [[h, "hour"], [m, "minute"], [s, "second"]];
    const shown = parts.filter(([v], i) => v > 0 || (i === 2 && h === 0 && m === 0));
    const display = style === "long" ? "long" : "narrow";
    const pieces = shown.map(([v, unit]) => numberFormat({ style: "unit", unit, unitDisplay: display }).format(v));
    return sign + (style === "long" ? format.list(pieces) : pieces.join(" "));
  },
  /** "a, b and c". */
  list: (items: string[], type: "conjunction" | "disjunction" = "conjunction") =>
    cached("l", { type }, () => new (Intl as any).ListFormat(undefined, { style: "long", type })).format(items) as string,
  /**
   * "3 cards", "1 card": `forms` by plural category (`one`, `other`, and
   * `few` / `many` where the language has them); `#` is the number.
   */
  count: (n: number, forms: { one?: string; few?: string; many?: string; other: string }) => {
    const category = cached("p", {}, () => new Intl.PluralRules(undefined)).select(n) as keyof typeof forms;
    return (forms[category] ?? forms.other).replace("#", format.number(n));
  },
  /**
   * "5m", "3h", "2d", then "Mar 4" (and "Mar 4, 2025" in another year):
   * the compact age feeds and lists show. `long`: "5 minutes ago".
   */
  relativeTime: (date: Date | number, options: { now?: number; style?: "narrow" | "long" } = {}) => {
    const ms = +date;
    const now = options.now ?? Date.now();
    const seconds = Math.round((now - ms) / 1000);
    if (options.style === "long") {
      const rtf = cached("r", {}, () => new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }));
      const abs = Math.abs(seconds);
      const [value, unit]: [number, Intl.RelativeTimeFormatUnit] =
        abs < 60 ? [seconds, "second"] : abs < 3600 ? [Math.round(seconds / 60), "minute"] : abs < 86400 ? [Math.round(seconds / 3600), "hour"]
          : abs < 604800 ? [Math.round(seconds / 86400), "day"] : abs < 2629800 ? [Math.round(seconds / 604800), "week"]
          : abs < 31557600 ? [Math.round(seconds / 2629800), "month"] : [Math.round(seconds / 31557600), "year"];
      return rtf.format(-value, unit);
    }
    if (seconds < 60) return "now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 7 * 86400) return `${Math.floor(seconds / 86400)}d`;
    const sameYear = new Date(ms).getFullYear() === new Date(now).getFullYear();
    return cached("d", { sameYear }, () => new Intl.DateTimeFormat(undefined, sameYear ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" }))
      .format(ms);
  },
  /** "Today", "Yesterday", "Tomorrow", a weekday within the week, else a date. */
  relativeDay: (date: Date | number, options: { now?: number } = {}) => {
    const day = startOfDay(+date);
    const today = startOfDay(options.now ?? Date.now());
    const diff = Math.round((day - today) / DAY);
    if (Math.abs(diff) <= 1) {
      const rtf = cached("rd", {}, () => new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }));
      const text = rtf.format(diff, "day");
      return text.charAt(0).toLocaleUpperCase() + text.slice(1);
    }
    if (diff > -7 && diff < 0) return cached("wd", {}, () => new Intl.DateTimeFormat(undefined, { weekday: "long" })).format(day);
    const sameYear = new Date(day).getFullYear() === new Date(today).getFullYear();
    return cached("d", { sameYear }, () => new Intl.DateTimeFormat(undefined, sameYear ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", year: "numeric" }))
      .format(day);
  },
};
