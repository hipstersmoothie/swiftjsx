import { useEffect, useState } from "react";
import { differenceInCalendarDays, format, formatDistanceToNowStrict, isToday, isYesterday } from "date-fns";
import type { Message } from "./store";

/** The current time, updated every `interval` ms, for relative times that age. */
export function useNow(interval = 30_000) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}

export const clockTime = (at: number) => format(at, "h:mm a");

/** "now", "12 minutes ago", "9:41 AM", "Yesterday", "Tuesday", "3/14/26". */
export function listTime(at: number, now: number) {
  const minutes = (now - at) / 60_000;
  if (minutes < 1) return "now";
  if (minutes < 60) return formatDistanceToNowStrict(at, { addSuffix: true, roundingMethod: "floor" });
  if (isToday(at)) return clockTime(at);
  if (isYesterday(at)) return "Yesterday";
  if (differenceInCalendarDays(now, at) < 7) return format(at, "EEEE");
  return format(at, "M/d/yy");
}

export function dayLabel(at: number) {
  if (isToday(at)) return "Today";
  if (isYesterday(at)) return "Yesterday";
  if (differenceInCalendarDays(Date.now(), at) < 7) return format(at, "EEEE");
  return format(at, "EEE, MMM d");
}

export type Day = { key: string; label: string; messages: Message[] };

export function groupByDay(messages: Message[]): Day[] {
  const days: Day[] = [];
  for (const message of messages) {
    const key = format(message.at, "yyyy-MM-dd");
    if (days[days.length - 1]?.key !== key) days.push({ key, label: dayLabel(message.at), messages: [] });
    days[days.length - 1].messages.push(message);
  }
  return days;
}

/** Bubbles from the same sender within a few minutes form a cluster; the last one shows the time. */
export const endsCluster = (message: Message, next: Message | undefined) =>
  !next || next.from !== message.from || next.at - message.at > 5 * 60_000;
