// Due dates are stored as the start of their day, in ms.
import { useSyncExternalStore } from "react";
import { addDays, differenceInCalendarDays, format, nextMonday, startOfToday, startOfTomorrow } from "date-fns";

export function dueLabel(due: number, today: number): { text: string; overdue: boolean } {
  const days = differenceInCalendarDays(due, today);
  if (days < 0) return { text: days === -1 ? "Yesterday" : format(due, "MMM d"), overdue: true };
  if (days === 0) return { text: "Today", overdue: false };
  if (days === 1) return { text: "Tomorrow", overdue: false };
  if (days < 7) return { text: format(due, "EEEE"), overdue: false };
  return { text: format(due, "EEE, MMM d"), overdue: false };
}

export function duePresets(today: number) {
  const presets = [
    { label: "Today", icon: "calendar", due: today },
    { label: "Tomorrow", icon: "sunrise", due: addDays(today, 1).getTime() },
    { label: "Next Week", icon: "calendar.badge.clock", due: nextMonday(today).getTime() },
  ];
  // On Sundays, tomorrow is next week.
  return presets.filter((p, i) => presets.findIndex((q) => q.due === p.due) === i);
}

/** Options for a due date Picker, including the current date if it isn't a preset. */
export function dueOptions(due: number | null, today: number) {
  const options = [{ value: "none", label: "None" }, ...duePresets(today).map((p) => ({ value: String(p.due), label: p.label }))];
  if (due !== null && !options.some((o) => o.value === String(due))) {
    options.push({ value: String(due), label: dueLabel(due, today).text });
  }
  return options;
}

// The snapshot is a number, so recomputing it on every read is fine; React
// re-reads it at midnight and when the app comes back to the foreground.
function subscribe(onChange: () => void) {
  let timer = 0;
  const schedule = () => {
    timer = setTimeout(() => {
      onChange();
      schedule();
    }, startOfTomorrow().getTime() - Date.now() + 1000);
  };
  schedule();
  addEventListener("visibilitychange", onChange);
  return () => {
    clearTimeout(timer);
    removeEventListener("visibilitychange", onChange);
  };
}

/** The start of today (ms), kept current. */
export const useToday = () => useSyncExternalStore(subscribe, () => startOfToday().getTime());
