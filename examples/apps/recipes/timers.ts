// Kitchen timers: several at once, each backed by a local notification so it
// rings even when the app is in the background. The countdown itself is just
// `endsAt` (a wall-clock time), so it's right again the moment the app comes
// back, however long JS was suspended. Persisted, so closing the app (or the
// gallery sheet) doesn't lose them; their notifications are still pending.
import { useEffect } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { format, haptic, useNow } from "swiftjsx";
import {
  requestPermission, getPermission, scheduleTimerNotification, cancelTimerNotification, type NotificationPermission,
} from "./services";
import { speak } from "./services";
import { formatDuration } from "./steps";

export type KitchenTimer = {
  id: string;
  /** 1, 2, 3… in the order they were started (for "timer-<n>" test ids). */
  n: number;
  label: string;
  recipeName: string;
  /** Total length in seconds, including time added. */
  duration: number;
  /** Wall-clock ms when it rings, while running. */
  endsAt: number | null;
  /** Seconds left, while paused. */
  remaining: number;
  state: "running" | "paused" | "done";
  /** When it rang (ms), once done. */
  doneAt?: number;
};

type TimerStore = {
  timers: KitchenTimer[];
  nextN: number;
  permission: NotificationPermission | null;
  start(label: string, seconds: number, recipeName: string): void;
  pause(id: string): void;
  resume(id: string): void;
  addTime(id: string, seconds: number): void;
  restart(id: string): void;
  cancel(id: string): void;
  /** Ring the timers whose time is up. */
  check(now: number): KitchenTimer[];
  refreshPermission(): void;
};

const notify = (timer: KitchenTimer, seconds: number) => {
  scheduleTimerNotification(
    timer.id,
    seconds,
    `${timer.label} timer is done`,
    `${formatDuration(timer.duration)} for ${timer.recipeName} is up.`,
  ).catch((error) => console.warn("timer notification:", error));
};

export const useTimers = create<TimerStore>()(
  persist(
    (set, get) => ({
      timers: [],
      nextN: 1,
      permission: null,

      start(label, seconds, recipeName) {
        const timer: KitchenTimer = {
          id: crypto.randomUUID(),
          n: get().nextN,
          label,
          recipeName,
          duration: seconds,
          endsAt: Date.now() + seconds * 1000,
          remaining: seconds,
          state: "running",
        };
        set(({ timers, nextN }) => ({ timers: [...timers, timer], nextN: nextN + 1 }));
        haptic("light");
        // Ask the first time a timer starts, when it's obvious why.
        requestPermission()
          .then((permission) => {
            set({ permission });
            const live = get().timers.find((t) => t.id === timer.id);
            if (permission === "granted" && live?.state === "running" && live.endsAt) notify(live, (live.endsAt - Date.now()) / 1000);
          })
          .catch((error) => console.warn("notification permission:", error));
      },

      pause(id) {
        cancelTimerNotification(id);
        set(({ timers }) => ({
          timers: timers.map((t) =>
            t.id === id && t.state === "running" && t.endsAt
              ? { ...t, state: "paused", endsAt: null, remaining: Math.max(0, (t.endsAt - Date.now()) / 1000) }
              : t,
          ),
        }));
      },

      resume(id) {
        const timer = get().timers.find((t) => t.id === id);
        if (!timer || timer.state !== "paused") return;
        const resumed: KitchenTimer = { ...timer, state: "running", endsAt: Date.now() + timer.remaining * 1000 };
        set(({ timers }) => ({ timers: timers.map((t) => (t.id === id ? resumed : t)) }));
        if (get().permission === "granted") notify(resumed, resumed.remaining);
      },

      addTime(id, seconds) {
        const timer = get().timers.find((t) => t.id === id);
        if (!timer) return;
        let next: KitchenTimer;
        if (timer.state === "done") {
          next = { ...timer, state: "running", duration: timer.duration + seconds, endsAt: Date.now() + seconds * 1000, remaining: seconds, doneAt: undefined };
        } else if (timer.state === "running" && timer.endsAt) {
          next = { ...timer, duration: timer.duration + seconds, endsAt: timer.endsAt + seconds * 1000 };
        } else {
          next = { ...timer, duration: timer.duration + seconds, remaining: timer.remaining + seconds };
        }
        set(({ timers }) => ({ timers: timers.map((t) => (t.id === id ? next : t)) }));
        if (next.state === "running" && next.endsAt && get().permission === "granted") notify(next, (next.endsAt - Date.now()) / 1000);
      },

      restart(id) {
        const timer = get().timers.find((t) => t.id === id);
        if (!timer) return;
        const next: KitchenTimer = { ...timer, state: "running", endsAt: Date.now() + timer.duration * 1000, remaining: timer.duration, doneAt: undefined };
        set(({ timers }) => ({ timers: timers.map((t) => (t.id === id ? next : t)) }));
        if (get().permission === "granted") notify(next, next.duration);
      },

      cancel(id) {
        cancelTimerNotification(id);
        set(({ timers }) => ({ timers: timers.filter((t) => t.id !== id) }));
      },

      check(now) {
        const due = get().timers.filter((t) => t.state === "running" && t.endsAt != null && t.endsAt <= now);
        if (!due.length) return [];
        const ids = new Set(due.map((t) => t.id));
        set(({ timers }) => ({
          timers: timers.map((t) => (ids.has(t.id) ? { ...t, state: "done", remaining: 0, doneAt: t.endsAt ?? now, endsAt: null } : t)),
        }));
        return due;
      },

      refreshPermission() {
        getPermission()
          .then((permission) => set({ permission }))
          .catch(() => set({ permission: "unavailable" }));
      },
    }),
    {
      name: "recipes-timers",
      storage: createJSONStorage(() => localStorage),
      partialize: ({ timers, nextN }) => ({ timers, nextN }),
    },
  ),
);

/** Seconds left on a timer at `now` (negative once it's overdue). */
export function secondsLeft(timer: KitchenTimer, now: number): number {
  if (timer.state === "running" && timer.endsAt != null) return (timer.endsAt - now) / 1000;
  if (timer.state === "paused") return timer.remaining;
  return -((now - (timer.doneAt ?? now)) / 1000);
}

/**
 * "4:05", "1:02:30"; overdue timers count up: "+0:42". Rounded up, so it
 * reads "0:01" until the time is really up.
 */
export function formatClock(seconds: number): string {
  return (seconds < 0 ? "+" : "") + format.duration(Math.ceil(Math.abs(seconds)));
}

/**
 * Mounted once at the app's root: keeps the notification permission current,
 * and says whether a timer is running (render <TimerAlarm> then).
 */
export function useTimerPermission(): boolean {
  const running = useTimers((s) => s.timers.some((t) => t.state === "running"));
  const refreshPermission = useTimers((s) => s.refreshPermission);

  // "unavailable" without the native backend (getPermission checks). Re-read
  // when the app comes back: the user may have flipped it in Settings.
  useEffect(() => {
    refreshPermission();
    addEventListener("visibilitychange", refreshPermission);
    return () => removeEventListener("visibilitychange", refreshPermission);
  }, [refreshPermission]);

  return running;
}

/**
 * Rings timers when they're up (while the app is open; in the background the
 * notification does it). Rendered only while a timer runs, so the clock only
 * ticks then.
 */
export function TimerAlarm(): null {
  const check = useTimers((s) => s.check);
  const now = useNow(500);

  useEffect(() => {
    // Timers that ran out while we were in the background already rang (the
    // notification); only announce the ones that are up just now.
    const due = check(now).filter((t) => now - (t.endsAt ?? 0) < 10_000);
    if (!due.length) return;
    haptic("success");
    const names = due.map((t) => t.label.toLowerCase()).join(" and ");
    speak("timer-alarm", `Your ${names} timer${due.length > 1 ? "s are" : " is"} done.`).catch(() => {});
  }, [now, check]);
  return null;
}
