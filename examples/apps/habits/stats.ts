// Schedules, streaks and rates. Everything is a pure function of the habit,
// the logs, today's day key and the locale's first weekday (`weekStartsOn`,
// 0 = Sunday), so the React Compiler can cache it per input.
//
// Schedules:
// - daily: due every day.
// - weekdays: due on the chosen weekdays; other days don't count (a Monday–
//   Friday habit keeps its streak over the weekend).
// - weekly (N times a week): flexible. A day only *requires* it once the
//   slack runs out (N − done so far ≥ days left in the week); before that
//   it's optional, and doing it counts. Streaks are in weeks.
import { getDay, type Day } from "date-fns";
import { addDayKeys, dayRange, parseDay, weekDays, weekStartKey, type DayKey } from "./dates";
import { format } from "swiftjsx";
import { countOn, type Habit, type Logs } from "./store";

export const started = (habit: Habit, day: DayKey) => day >= habit.createdAt;

/** Due on this weekday (daily and weekdays schedules; weekly habits are flexible). */
export function scheduledOn(habit: Habit, day: DayKey): boolean {
  switch (habit.schedule.kind) {
    case "daily":
      return true;
    case "weekdays":
      return habit.schedule.days.includes(getDay(parseDay(day)));
    case "weekly":
      return false;
  }
}

export const fractionOn = (habit: Habit, logs: Logs, day: DayKey) => Math.min(1, countOn(logs, habit.id, day) / habit.target);
export const doneOn = (habit: Habit, logs: Logs, day: DayKey) => countOn(logs, habit.id, day) >= habit.target;

/** Days completed in the week containing `day` (only days before `before`, if given). */
export function doneInWeek(habit: Habit, logs: Logs, day: DayKey, weekStartsOn: Day, before?: DayKey): number {
  let n = 0;
  for (const d of weekDays(day, weekStartsOn)) {
    if (before !== undefined && d >= before) break;
    if (doneOn(habit, logs, d)) n++;
  }
  return n;
}

/** Whether skipping this day would miss the habit's goal (see the top of the file). */
export function requiredOn(habit: Habit, logs: Logs, day: DayKey, weekStartsOn: Day): boolean {
  if (!started(habit, day)) return false;
  if (habit.schedule.kind !== "weekly") return scheduledOn(habit, day);
  const week = weekDays(day, weekStartsOn);
  const needed = habit.schedule.times - doneInWeek(habit, logs, day, weekStartsOn, day);
  const daysLeft = week.length - week.indexOf(day);
  return needed > 0 && needed >= daysLeft;
}

/** Shown in the day's list: due, or a weekly habit that still has days to fill (or was done that day). */
export function listedOn(habit: Habit, logs: Logs, day: DayKey, weekStartsOn: Day): boolean {
  if (!started(habit, day)) return false;
  if (habit.schedule.kind !== "weekly") return scheduledOn(habit, day);
  return doneOn(habit, logs, day) || doneInWeek(habit, logs, day, weekStartsOn, day) < habit.schedule.times;
}

/** Counts toward the day's ring: required that day, or done that day. */
const countsOn = (habit: Habit, logs: Logs, day: DayKey, weekStartsOn: Day) =>
  requiredOn(habit, logs, day, weekStartsOn) || (started(habit, day) && doneOn(habit, logs, day));

export type DayProgress = { done: number; total: number; fraction: number };

/** All habits on a day: how many of those that count are done, and the ring's fill (partial counts help). */
export function dayProgress(habits: Habit[], logs: Logs, day: DayKey, weekStartsOn: Day): DayProgress {
  let done = 0;
  let total = 0;
  let filled = 0;
  for (const habit of habits) {
    if (!countsOn(habit, logs, day, weekStartsOn)) continue;
    total++;
    filled += fractionOn(habit, logs, day);
    if (doneOn(habit, logs, day)) done++;
  }
  return { done, total, fraction: total ? filled / total : 0 };
}

export type DayStatus =
  | "future"
  | "before" // before the habit started
  | "off" // not scheduled that day
  | "done"
  | "partial" // some check-ins, not the target
  | "missed"
  | "pending" // today, not done yet
  | "optional"; // a weekly habit's free day, not done

export function dayStatus(habit: Habit, logs: Logs, day: DayKey, today: DayKey, weekStartsOn: Day): DayStatus {
  if (day > today) return "future";
  if (!started(habit, day)) return "before";
  const count = countOn(logs, habit.id, day);
  if (count >= habit.target) return "done";
  if (habit.schedule.kind === "weekdays" && !scheduledOn(habit, day)) return count > 0 ? "partial" : "off";
  if (count > 0) return "partial";
  if (day === today) return "pending";
  if (habit.schedule.kind === "weekly") return requiredOn(habit, logs, day, weekStartsOn) ? "missed" : "optional";
  return "missed";
}

// MARK: Streaks

export type Streaks = { current: number; best: number; unit: "day" | "week" };

export function streaks(habit: Habit, logs: Logs, today: DayKey, weekStartsOn: Day): Streaks {
  let run = 0;
  let best = 0;
  if (habit.schedule.kind === "weekly") {
    const times = habit.schedule.times;
    const first = weekStartKey(habit.createdAt, weekStartsOn);
    const current = weekStartKey(today, weekStartsOn);
    for (let week = first; week <= current; week = addDayKeys(week, 7)) {
      if (doneInWeek(habit, logs, week, weekStartsOn) >= times) {
        run++;
        best = Math.max(best, run);
      } else if (week !== current && week !== first) {
        // This week is still open; the first one may have been partial.
        run = 0;
      }
    }
    return { current: run, best, unit: "week" };
  }
  for (const day of dayRange(habit.createdAt, today)) {
    if (!scheduledOn(habit, day)) continue;
    if (doneOn(habit, logs, day)) {
      run++;
      best = Math.max(best, run);
    } else if (day !== today) {
      // Today isn't over: not done yet doesn't break the streak.
      run = 0;
    }
  }
  return { current: run, best, unit: "day" };
}

/** Days in a row (ending today, or yesterday if today isn't finished) where every habit that counted was done. */
export function perfectDays(habits: Habit[], logs: Logs, today: DayKey, weekStartsOn: Day): number {
  const todays = dayProgress(habits, logs, today, weekStartsOn);
  let n = todays.total > 0 && todays.done === todays.total ? 1 : 0;
  let day = addDayKeys(today, -1);
  const earliest = habits.reduce((min, h) => (h.createdAt < min ? h.createdAt : min), today);
  while (day >= earliest) {
    const p = dayProgress(habits, logs, day, weekStartsOn);
    if (p.total > 0 && p.done < p.total) break;
    if (p.total > 0) n++;
    day = addDayKeys(day, -1);
  }
  return n;
}

// MARK: Rates and series

/** Share of the goal met over the last `days` days (null before there's anything to measure). */
export function completionRate(habit: Habit, logs: Logs, today: DayKey, weekStartsOn: Day, days = 30): number | null {
  const from = [habit.createdAt, addDayKeys(today, -(days - 1))].sort()[1];
  if (habit.schedule.kind === "weekly") {
    const times = habit.schedule.times;
    let met = 0;
    let goal = 0;
    const current = weekStartKey(today, weekStartsOn);
    for (let week = weekStartKey(from, weekStartsOn); week <= current; week = addDayKeys(week, 7)) {
      const done = doneInWeek(habit, logs, week, weekStartsOn);
      if (week === current && done < times) continue; // still open
      met += Math.min(done, times);
      goal += times;
    }
    return goal ? met / goal : null;
  }
  let done = 0;
  let due = 0;
  for (const day of dayRange(from, today)) {
    if (!scheduledOn(habit, day)) continue;
    const isDone = doneOn(habit, logs, day);
    if (day === today && !isDone) continue;
    due++;
    if (isDone) done++;
  }
  return due ? done / due : null;
}

export const totalCompletions = (habit: Habit, logs: Logs) =>
  Object.values(logs[habit.id] ?? {}).filter((count) => count >= habit.target).length;

/** Days a week the habit asks for. */
export function weeklyGoal(habit: Habit): number {
  switch (habit.schedule.kind) {
    case "daily":
      return 7;
    case "weekdays":
      return habit.schedule.days.length;
    case "weekly":
      return habit.schedule.times;
  }
}

export type WeekPoint = { week: DayKey; done: number };

/** Completed days per week for the last `weeks` weeks (this week last). */
export function weeklySeries(habit: Habit, logs: Logs, today: DayKey, weekStartsOn: Day, weeks = 12): WeekPoint[] {
  const current = weekStartKey(today, weekStartsOn);
  return Array.from({ length: weeks }, (_, i) => {
    const week = addDayKeys(current, -7 * (weeks - 1 - i));
    return { week, done: doneInWeek(habit, logs, week, weekStartsOn) };
  });
}

export type HeatCell = { day: DayKey; fraction: number; status: DayStatus };

/** `weeks` columns of 7 days (locale order) ending with this week, for the heatmap. */
export function heatmap(habit: Habit, logs: Logs, today: DayKey, weekStartsOn: Day, weeks = 26): HeatCell[][] {
  const current = weekStartKey(today, weekStartsOn);
  return Array.from({ length: weeks }, (_, i) =>
    weekDays(addDayKeys(current, -7 * (weeks - 1 - i)), weekStartsOn).map((day) => ({
      day,
      fraction: fractionOn(habit, logs, day),
      status: dayStatus(habit, logs, day, today, weekStartsOn),
    })),
  );
}

/** "Every day", "Mon, Wed, Fri", "3 times a week". */
export function describeSchedule(habit: Pick<Habit, "schedule">, weekdayName: (d: number) => string, order: number[]): string {
  const s = habit.schedule;
  if (s.kind === "daily") return "Every day";
  if (s.kind === "weekly") return format.count(s.times, { one: "Once a week", other: "# times a week" });
  const days = order.filter((d) => s.days.includes(d));
  if (days.length === 7) return "Every day";
  if (days.length === 5 && !days.includes(0) && !days.includes(6)) return "Weekdays";
  if (days.length === 2 && days.includes(0) && days.includes(6)) return "Weekends";
  return days.map(weekdayName).join(", ");
}

export const streakText = (n: number, unit: "day" | "week") =>
  unit === "day" ? format.count(n, { one: "# day", other: "# days" }) : format.count(n, { one: "# week", other: "# weeks" });
