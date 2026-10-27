// Note titles, previews, dates and sorting, shared by the list and the editor.
import { useSyncExternalStore } from "react";
import { format, isToday, isYesterday, differenceInCalendarDays } from "date-fns";
import { plainLines } from "./markdown";
import type { Note, Sort } from "./store";

/** The explicit title, else the body's first line (like Notes), else "New Note". */
export function displayTitle(note: Pick<Note, "title" | "body">): string {
  return note.title.trim() || plainLines(note.body).find((l) => l.trim())?.trim() || "New Note";
}

/** The first line of body text that isn't already the title. */
export function preview(note: Pick<Note, "title" | "body">): string {
  const lines = plainLines(note.body).map((l) => l.trim()).filter(Boolean);
  const rest = note.title.trim() ? lines : lines.slice(1);
  return rest[0] ?? "No additional text";
}

export const isEmptyNote = (note: Pick<Note, "title" | "body">) => !note.title.trim() && !note.body.trim();

/** "3:41 PM", "Yesterday", "Tuesday", "10/2/26" — the Notes list style. */
export function relativeDate(ms: number, now: number): string {
  if (isToday(ms)) return format(ms, "p");
  if (isYesterday(ms)) return "Yesterday";
  if (differenceInCalendarDays(now, ms) < 7) return format(ms, "EEEE");
  return format(ms, "M/d/yy");
}

export const longDate = (ms: number) => format(ms, "MMMM d, yyyy 'at' p");

export function sortNotes(notes: Note[], sort: Sort): Note[] {
  const copy = [...notes];
  switch (sort) {
    case "edited":
      return copy.sort((a, b) => b.updatedAt - a.updatedAt);
    case "created":
      return copy.sort((a, b) => b.createdAt - a.createdAt);
    case "title":
      return copy.sort((a, b) => displayTitle(a).localeCompare(displayTitle(b), undefined, { sensitivity: "base" }));
  }
}

export const sortLabels: Record<Sort, string> = { edited: "Date Edited", created: "Date Created", title: "Title" };

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} bytes`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

// The current time, re-read every minute (and when the app returns to the
// foreground), so "Yesterday" and the like stay right.
// The snapshot is rounded to the minute, so it's stable between ticks.
function subscribe(onChange: () => void) {
  const timer = setInterval(onChange, 15_000);
  addEventListener("focus", onChange);
  return () => {
    clearInterval(timer);
    removeEventListener("focus", onChange);
  };
}
export const useNow = () => useSyncExternalStore(subscribe, () => Math.floor(Date.now() / 60_000) * 60_000);
