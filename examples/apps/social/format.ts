// Relative times, compact counts, and caption tokens (@mentions, #hashtags).
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInWeeks, format, formatDistanceToNowStrict } from "date-fns";

/** "2 hours ago", "3 days ago"; older than a week: "October 3" (with the year when it isn't this one). */
export function ago(time: number, now = Date.now()): string {
  if (now - time < 60_000) return "Just now";
  if (differenceInDays(now, time) < 7) return formatDistanceToNowStrict(time, { addSuffix: true });
  return format(time, new Date(time).getFullYear() === new Date(now).getFullYear() ? "MMMM d" : "MMMM d, yyyy");
}

/** Instagram's short form: "now", "5m", "3h", "2d", "4w". */
export function shortAgo(time: number, now = Date.now()): string {
  const minutes = differenceInMinutes(now, time);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = differenceInHours(now, time);
  if (hours < 24) return `${hours}h`;
  const days = differenceInDays(now, time);
  if (days < 7) return `${days}d`;
  return `${differenceInWeeks(now, time)}w`;
}

/** 1,234 · 12.4K · 2.3M */
export function compact(n: number): string {
  if (n < 10_000) return n.toLocaleString("en-US");
  if (n < 1_000_000) return `${trim(n / 1000)}K`;
  return `${trim(n / 1_000_000)}M`;
}
const trim = (n: number) => (n >= 100 ? Math.floor(n).toString() : (Math.floor(n * 10) / 10).toString());

export const plural = (n: number, one: string, many = one + "s") => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

export type Token = { text: string; kind: "text" | "mention" | "tag" };

/** Splits text into plain runs, @mentions and #hashtags. */
export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const pattern = /([@#][\p{L}\p{N}_.]*[\p{L}\p{N}_])/gu;
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const at = match.index ?? 0;
    // "email@domain" isn't a mention: it must start a word.
    if (at > 0 && /[\p{L}\p{N}_]/u.test(text[at - 1])) continue;
    if (at > last) tokens.push({ text: text.slice(last, at), kind: "text" });
    tokens.push({ text: match[0], kind: match[0][0] === "@" ? "mention" : "tag" });
    last = at + match[0].length;
  }
  if (last < text.length) tokens.push({ text: text.slice(last), kind: "text" });
  return tokens;
}

/** Captions long enough to be cut off at two lines (there's no way to ask Text if it truncated). */
export const isLong = (text: string) => text.length > 90 || text.includes("\n");
