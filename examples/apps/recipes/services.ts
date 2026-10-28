// Keep-awake, read-aloud and timer notifications, on SwiftJSX's built-in
// services (no native backend). Speech state (what's being read, and the word
// being spoken) is shared so cooking mode can highlight along.
import { useSyncExternalStore } from "react";
import { notifications, speech, useKeepAwake as useLibraryKeepAwake } from "swiftjsx";

// MARK: Keep awake

/** Keeps the screen on while `active`. */
export function useKeepAwake(active = true) {
  useLibraryKeepAwake(active);
}

// MARK: Speech

export type SpeechState = {
  /** What's being read (a step's key), or null. */
  key: string | null;
  /** The word being spoken, as UTF-16 offsets into the text (JS string indices). */
  range: { location: number; length: number } | null;
};

let state: SpeechState = { key: null, range: null };
const listeners = new Set<() => void>();
const emit = (next: SpeechState) => {
  state = next;
  listeners.forEach((listener) => listener());
};

/** Reads `text` aloud, replacing whatever was being read. */
export async function speak(key: string, text: string) {
  if (state.key) await speech.stop();
  emit({ key, range: null });
  const result = await speech.speak(text, {
    onWord: ({ start, length }) => {
      if (state.key === key) emit({ key, range: { location: start, length } });
    },
  });
  // A newer speak() or stopSpeaking() has taken over if the key changed.
  if (result === "finished" && state.key === key) emit({ key: null, range: null });
}

export async function stopSpeaking() {
  if (!state.key) return;
  emit({ key: null, range: null });
  await speech.stop();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSpeech(): SpeechState {
  return useSyncExternalStore(subscribe, () => state);
}

// MARK: Timer notifications

export type NotificationPermission = "unavailable" | "notDetermined" | "denied" | "granted";

/** Whether local notifications work here (not outside an app bundle, e.g. `swift run`). */
export let notificationsAvailable = true;
void notifications.getPermission().then((status) => {
  notificationsAvailable = status !== "unavailable";
});

export async function getPermission(): Promise<NotificationPermission> {
  const status = await notifications.getPermission();
  return status === "provisional" ? "granted" : status;
}

/** Asks once (iOS shows the prompt only the first time); afterwards reports the user's choice. */
export async function requestPermission(): Promise<NotificationPermission> {
  const current = await getPermission();
  if (current !== "notDetermined") return current;
  return (await notifications.requestPermission()) ? "granted" : "denied";
}

const requestId = (timerId: string) => `recipes.timer.${timerId}`;

/** Schedules (or reschedules: same id replaces) the notification for a timer. */
export async function scheduleTimerNotification(timerId: string, seconds: number, title: string, body: string): Promise<void> {
  await notifications.schedule({ id: requestId(timerId), title, body, seconds: Math.max(1, Math.round(seconds)), group: "recipes.timers", data: { timerId } });
}

export function cancelTimerNotification(timerId: string) {
  void notifications.cancel(requestId(timerId));
}
