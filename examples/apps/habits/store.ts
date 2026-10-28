// Habits and their check-ins in zustand (with immer), persisted to
// localStorage. Actions are plain functions next to the store.
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { nanoid } from "nanoid";
import type { DayKey } from "./dates";
import type { Hex } from "./theme";
import { seed } from "./seed";

export type Schedule =
  | { kind: "daily" }
  /** On these weekdays (0 = Sunday). */
  | { kind: "weekdays"; days: number[] }
  /** Any N days a week. */
  | { kind: "weekly"; times: number };

export type Reminder = { hour: number; minute: number };

export type Habit = {
  id: string;
  name: string;
  icon: string;
  color: Hex;
  schedule: Schedule;
  /** Check-ins a day to complete it (8 glasses of water); 1 for yes/no habits. */
  target: number;
  /** What's counted ("glasses"), when target > 1. */
  unit: string;
  reminder: Reminder | null;
  /** The day it starts counting from. */
  createdAt: DayKey;
};

/** Check-ins per habit per day: logs[habitId][day] = count. */
export type Logs = Record<string, Record<DayKey, number>>;

export type State = { habits: Habit[]; logs: Logs };

export const useHabits = create<State>()(
  persist(
    immer(() => seed()),
    {
      name: "habits",
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// MARK: Actions

export type HabitInput = Omit<Habit, "id" | "createdAt">;

export function addHabit(input: HabitInput, today: DayKey): string {
  const id = nanoid(10);
  useHabits.setState((s) => {
    s.habits.push({ ...input, id, createdAt: today });
    s.logs[id] = {};
  });
  return id;
}

export function updateHabit(id: string, input: HabitInput) {
  useHabits.setState((s) => {
    const habit = s.habits.find((h) => h.id === id);
    if (!habit) return;
    Object.assign(habit, input);
    // A lower target leaves old days over it: clamp them, so stats stay sane.
    const log = s.logs[id] ?? {};
    for (const day in log) log[day] = Math.min(log[day], input.target);
  });
}

export function deleteHabit(id: string) {
  useHabits.setState((s) => {
    s.habits = s.habits.filter((h) => h.id !== id);
    delete s.logs[id];
  });
}

export function moveHabits(from: number[], to: number) {
  useHabits.setState((s) => {
    const moving = from.map((i) => s.habits[i]);
    const kept = s.habits.filter((_, i) => !from.includes(i));
    const before = from.filter((i) => i < to).length;
    kept.splice(to - before, 0, ...moving);
    s.habits = kept;
  });
}

/** Set a day's count (clamped to 0…target). */
export function setCount(id: string, day: DayKey, count: number) {
  useHabits.setState((s) => {
    const habit = s.habits.find((h) => h.id === id);
    if (!habit) return;
    const log = (s.logs[id] ??= {});
    const next = Math.max(0, Math.min(habit.target, Math.round(count)));
    if (next === 0) delete log[day];
    else log[day] = next;
  });
}

export const countOn = (logs: Logs, id: string, day: DayKey) => logs[id]?.[day] ?? 0;

/** Start over with the sample habits (Settings → Reset). */
export function resetToSample() {
  useHabits.setState(seed());
}
