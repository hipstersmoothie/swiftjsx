// Due dates are stored as the start of their day, in ms.
import { addDays, addWeeks, differenceInCalendarDays, format as formatDate, startOfWeek } from "date-fns";
import { format } from "swiftjsx";

/** 0 = Sunday … 6 = Saturday (`useEnvironment().locale.weekStartsOn`). */
type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export function dueLabel(due: number, today: number): { text: string; overdue: boolean } {
  const days = differenceInCalendarDays(due, today);
  // "Yesterday", "Today", "Tomorrow", then weekdays a week either way.
  if (days < 7) return { text: format.relativeDay(due, { now: today }), overdue: days < 0 };
  return { text: formatDate(due, "EEE, MMM d"), overdue: false };
}

export function duePresets(today: number, weekStartsOn: WeekStart) {
  const presets = [
    { label: "Today", icon: "calendar", due: today },
    { label: "Tomorrow", icon: "sunrise", due: addDays(today, 1).getTime() },
    // The first day of next week, in the user's locale (Monday or Sunday…).
    { label: "Next Week", icon: "calendar.badge.clock", due: startOfWeek(addWeeks(today, 1), { weekStartsOn }).getTime() },
  ];
  // On the last day of the week, tomorrow is next week.
  return presets.filter((p, i) => presets.findIndex((q) => q.due === p.due) === i);
}

/** Options for a due date Picker, including the current date if it isn't a preset. */
export function dueOptions(due: number | null, today: number, weekStartsOn: WeekStart) {
  const options = [{ value: "none", label: "None" }, ...duePresets(today, weekStartsOn).map((p) => ({ value: String(p.due), label: p.label }))];
  if (due !== null && !options.some((o) => o.value === String(due))) {
    options.push({ value: String(due), label: dueLabel(due, today).text });
  }
  return options;
}
