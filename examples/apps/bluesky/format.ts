// Numbers and times, the way the Bluesky app shows them. Formatters are made
// once (Intl constructors are slow without a JIT).

const compactFormat = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });
const fullNumber = new Intl.NumberFormat();
const dateShort = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const dateWithYear = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });
const fullTime = new Intl.DateTimeFormat(undefined, { dateStyle: "long", timeStyle: "short" });
const joined = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });

/** 1234 → "1.2K". */
export const compact = (n: number | undefined) => (n ? compactFormat.format(n) : "0");
export const formatNumber = (n: number | undefined) => fullNumber.format(n ?? 0);

/** "now", "5m", "3h", "2d", then "Mar 4" (and the year once it's not this one). */
export function ago(iso: string, now: number): string {
  const then = Date.parse(iso);
  const seconds = Math.max(0, (now - then) / 1000);
  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 7 * 86400) return `${Math.floor(seconds / 86400)}d`;
  const date = new Date(then);
  return date.getFullYear() === new Date(now).getFullYear() ? dateShort.format(date) : dateWithYear.format(date);
}

/** For VoiceOver: "5 minutes ago". */
const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
export function agoSpoken(iso: string, now: number): string {
  const seconds = Math.round((Date.parse(iso) - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return relative.format(seconds, "second");
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return relative.format(Math.round(seconds / 3600), "hour");
  return relative.format(Math.round(seconds / 86400), "day");
}

export const fullTimestamp = (iso: string) => fullTime.format(new Date(iso));
export const joinedDate = (iso: string) => joined.format(new Date(iso));

/** `count` with the right noun: "1 like", "2 likes". */
const plural = new Intl.PluralRules();
export function counted(count: number, one: string, other: string) {
  return `${formatNumber(count)} ${plural.select(count) === "one" ? one : other}`;
}

export const displayName = (actor: { displayName?: string; handle: string }) => actor.displayName?.trim() || actor.handle;

/** "example.com" from a URL (no www). */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
