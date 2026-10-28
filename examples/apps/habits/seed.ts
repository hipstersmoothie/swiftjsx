// About four months of believable history for four habits, generated
// relative to today on first launch (so the sample always looks current).
// Streaky on purpose: a good day makes the next one likelier, weekends are
// weaker, and there's a two-week slump about six weeks ago.
import { getDay } from "date-fns";
// weekStartKey follows the locale, so "this week" matches the week strip.
import { addDayKeys, dayKey, dayRange, parseDay, weekStartKey, type DayKey } from "./dates";
import type { Habit, Logs, State } from "./store";

/** A small seeded PRNG (mulberry32): the same history every time. */
function random(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seed(): State {
  const today = dayKey(Date.now());
  const ago = (n: number) => addDayKeys(today, -n);
  const slump = (day: DayKey) => day >= ago(48) && day <= ago(36);
  const weekend = (day: DayKey) => [0, 6].includes(getDay(parseDay(day)));

  const habits: Habit[] = [
    {
      id: "water", name: "Drink Water", icon: "drop.fill", color: "#32ADE6",
      schedule: { kind: "daily" }, target: 8, unit: "glasses", reminder: { hour: 9, minute: 0 }, createdAt: ago(124),
    },
    {
      id: "read", name: "Read 20 Minutes", icon: "book.fill", color: "#FF9500",
      schedule: { kind: "daily" }, target: 1, unit: "", reminder: { hour: 21, minute: 30 }, createdAt: ago(118),
    },
    {
      id: "workout", name: "Work Out", icon: "figure.run", color: "#34C759",
      schedule: { kind: "weekly", times: 3 }, target: 1, unit: "", reminder: { hour: 7, minute: 0 }, createdAt: ago(110),
    },
    {
      // Weekdays only, and newer: the calendar dims the days before it started.
      id: "meditate", name: "Meditate", icon: "brain.head.profile", color: "#AF52DE",
      schedule: { kind: "weekdays", days: [1, 2, 3, 4, 5] }, target: 1, unit: "", reminder: null, createdAt: ago(61),
    },
  ];

  const logs: Logs = { water: {}, read: {}, workout: {}, meditate: {} };
  const rand = random(20261027);

  // Water: most days 6–8 glasses; today's still in progress.
  for (const day of dayRange(habits[0].createdAt, ago(1))) {
    const r = rand();
    const full = r < (slump(day) ? 0.35 : weekend(day) ? 0.6 : 0.82);
    logs.water[day] = full ? 8 : Math.max(1, Math.round(3 + rand() * 4));
  }
  logs.water[today] = 3;

  // Reading: streaky (a Markov chain), with a current streak of about two weeks.
  let read = true;
  for (const day of dayRange(habits[1].createdAt, ago(1))) {
    const p: number = slump(day) ? 0.3 : read ? 0.86 : 0.55;
    read = rand() < p || day >= ago(13);
    if (read) logs.read[day] = 1;
  }

  // Workouts: 2–4 sessions most weeks (never more than 5), on random days.
  const perWeek: Record<DayKey, number> = {};
  for (const day of dayRange(habits[2].createdAt, ago(1))) {
    const week = weekStartKey(day);
    if ((perWeek[week] ?? 0) >= 5 || rand() >= (slump(day) ? 0.15 : 0.47)) continue;
    perWeek[week] = (perWeek[week] ?? 0) + 1;
    logs.workout[day] = 1;
  }
  // One done already this week, unless the week started today.
  const thisWeek = weekStartKey(today);
  if (thisWeek < today) logs.workout[thisWeek] = 1;

  // Meditation: weekday mornings, very regular lately.
  for (const day of dayRange(habits[3].createdAt, ago(1))) {
    if (weekend(day)) continue;
    if (rand() < (day >= ago(20) ? 0.95 : 0.75)) logs.meditate[day] = 1;
  }
  if (!weekend(today)) logs.meditate[today] = 1;

  return { habits, logs };
}
