import { format as formatDate, isToday } from "date-fns";
import { format } from "swiftjsx";
import type { Message } from "./store";

export const clockTime = (at: number) => formatDate(at, "h:mm a");

/** "now", "12 minutes ago", "9:41 AM", "Yesterday", "Tuesday", "Mar 14". */
export function listTime(at: number, now: number) {
  const minutes = (now - at) / 60_000;
  if (minutes < 1) return "now";
  if (minutes < 60) return format.relativeTime(at, { now, style: "long" });
  if (isToday(at)) return clockTime(at);
  return format.relativeDay(at, { now });
}

export type Day = { key: string; label: string; messages: Message[] };

export function groupByDay(messages: Message[]): Day[] {
  const days: Day[] = [];
  for (const message of messages) {
    const key = formatDate(message.at, "yyyy-MM-dd");
    if (days[days.length - 1]?.key !== key) days.push({ key, label: format.relativeDay(message.at), messages: [] });
    days[days.length - 1].messages.push(message);
  }
  return days;
}

/** Bubbles from the same sender within a few minutes form a cluster; the last one shows the time. */
export const endsCluster = (message: Message, next: Message | undefined) =>
  !next || next.from !== message.from || next.at - message.at > 5 * 60_000;
