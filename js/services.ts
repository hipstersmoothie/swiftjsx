// Platform services without the native backend: local notifications and the
// app badge, text-to-speech, keeping the screen awake, and
// navigator.geolocation.

import { useEffect, useRef, useState } from "react";
import { nativeCall } from "./renderer";

// Events from Swift (a notification arrived or was tapped, a word spoken).
type Listener = (payload: any) => void;
const listeners = new Map<string, Set<Listener>>();
/** Taps that came before anyone listened (the one that launched the app). */
const heldResponses: NotificationResponse[] = [];

(globalThis as any).__swiftjsx_emit = (name: string, payload: unknown) => {
  const set = listeners.get(name);
  if (name === "notificationResponse" && !set?.size) {
    heldResponses.push(payload as NotificationResponse);
    return;
  }
  set?.forEach((listener) => listener(payload));
};

function listen(name: string, listener: Listener): () => void {
  let set = listeners.get(name);
  if (!set) listeners.set(name, (set = new Set()));
  set.add(listener);
  return () => set!.delete(listener);
}

// MARK: Notifications

export type NotificationContent = {
  id: string;
  title: string;
  subtitle: string;
  body: string;
  /** What you passed as `data` when scheduling. */
  data: unknown;
};
export type NotificationResponse = NotificationContent & {
  /** "open" (tapped), "dismiss" (with a category's `dismissAction`), or a custom action's id. */
  action: string;
  /** What they typed, for an action with `textInput`. */
  text?: string;
};
export type NotificationAction = {
  id: string;
  title: string;
  /** Shown in red. */
  destructive?: boolean;
  /** Opens the app (otherwise it's handled in the background). */
  foreground?: boolean;
  /** Needs the device unlocked. */
  authenticate?: boolean;
  systemImage?: string;
  /** A reply field; its text comes back as the response's `text`. */
  textInput?: { button?: string; placeholder?: string };
};
export type NotificationCategory = {
  id: string;
  /** Buttons shown when the notification is long-pressed / expanded. */
  actions: NotificationAction[];
  /** Report swipe-to-dismiss as a "dismiss" response. */
  dismissAction?: boolean;
};
export type NotificationRequest = {
  /** Reuse an id to replace a scheduled notification (default: a new UUID). */
  id?: string;
  title: string;
  subtitle?: string;
  body?: string;
  /** Default true. */
  sound?: boolean;
  /** The app icon's badge number when it's delivered. */
  badge?: number;
  /** Anything JSON: comes back in the receive / response events (deep links). */
  data?: unknown;
  /** Notifications with the same group are stacked together. */
  group?: string;
  /** A category from `setCategories` (its action buttons). */
  category?: string;
  /** Images, audio or video to show with it (file: or https: URLs; downloaded first). */
  attachments?: (string | { url: string; id?: string })[];
  /**
   * "timeSensitive" breaks through Focus (needs the Time Sensitive
   * Notifications capability); "passive" arrives silently; "critical" needs
   * an entitlement from Apple. Default "active".
   */
  interruptionLevel?: "passive" | "active" | "timeSensitive" | "critical";
  /** 0…1: which one is featured in a group's summary. */
  relevance?: number;
  /** When: a Date, or seconds from now. Neither: right away. */
  at?: Date;
  seconds?: number;
  /** With `at`: every day at that time; with `seconds`: every N seconds (≥ 60). */
  repeats?: boolean;
};

export const notifications = {
  /** Asks once (the system remembers the answer); resolves to whether they're allowed. */
  async requestPermission(options: { provisional?: boolean } = {}): Promise<boolean> {
    return (await nativeCall("notificationsRequest", options)) === true;
  },
  /** "unavailable" outside an app bundle (e.g. `swift run`). */
  async getPermission(): Promise<"granted" | "provisional" | "denied" | "notDetermined" | "unavailable"> {
    return (await nativeCall("notificationsStatus", {})) as any;
  },
  /** Schedules a local notification; resolves to its id (null if it couldn't be added). */
  async schedule(request: NotificationRequest): Promise<string | null> {
    const { at, ...rest } = request;
    return (await nativeCall("notificationsSchedule", { ...rest, at: at ? +at : undefined })) as string | null;
  },
  /**
   * The action buttons notifications can have, by category (replaces the
   * previous set; call it at startup). Taps on them are "response" events
   * with `action` set to the action's id.
   */
  async setCategories(categories: NotificationCategory[]): Promise<void> {
    await nativeCall("notificationsCategories", { categories });
  },
  /** Removes scheduled and delivered notifications: these ids, or all. */
  async cancel(ids?: string | string[]): Promise<void> {
    await nativeCall("notificationsCancel", ids === undefined ? {} : { ids: Array.isArray(ids) ? ids : [ids] });
  },
  async pending(): Promise<{ id: string; title: string; body: string; at?: Date }[]> {
    const list = ((await nativeCall("notificationsPending", {})) ?? []) as { id: string; title: string; body: string; at?: number }[];
    return list.map((item) => ({ ...item, at: item.at === undefined ? undefined : new Date(item.at) }));
  },
  /** The number on the app icon (0 clears it). */
  async setBadgeCount(count: number): Promise<void> {
    await nativeCall("badge", { count });
  },
  /**
   * "receive": one arrived while the app is open (it shows as a banner too).
   * "response": the user tapped one (or an action), including the tap that
   * launched the app, which waits for the first listener.
   */
  addListener<T extends "receive" | "response">(
    type: T,
    listener: (event: T extends "response" ? NotificationResponse : NotificationContent) => void,
  ): () => void {
    if (type === "response") {
      const remove = listen("notificationResponse", listener);
      heldResponses.splice(0).forEach((response) => listener(response as any));
      return remove;
    }
    return listen("notification", listener);
  },
};

/** Calls `listener` for notification taps (and arrivals with `type: "receive"`) while mounted. */
export function useNotificationListener<T extends "receive" | "response">(
  type: T,
  listener: (event: T extends "response" ? NotificationResponse : NotificationContent) => void,
) {
  const latest = useRef(listener);
  useEffect(() => {
    latest.current = listener;
  });
  useEffect(() => notifications.addListener(type, (event) => latest.current(event)), [type]);
}

// MARK: Speech

export type SpeakOptions = {
  /** 0…1; 0.5 is normal speed. */
  rate?: number;
  /** 0.5…2 (default 1). */
  pitch?: number;
  /** 0…1. */
  volume?: number;
  /** A BCP 47 language ("en-US", "fr-FR"), or use `voice`. */
  language?: string;
  /** A voice id from `speech.voices()`. */
  voice?: string;
  /** Each word as it's spoken: its range in `text` (highlight as you read). */
  onWord?: (range: { start: number; length: number }) => void;
};

let nextUtterance = 1;

export const speech = {
  /**
   * Speaks `text` (queued after anything already speaking; other audio ducks).
   * Resolves "finished", or "cancelled" after `stop()`.
   */
  async speak(text: string, options: SpeakOptions = {}): Promise<"finished" | "cancelled"> {
    const { onWord, ...rest } = options;
    const id = nextUtterance++;
    const remove = onWord
      ? listen("speechWord", (event: { id: number; start: number; length: number }) => {
          if (event.id === id) onWord({ start: event.start, length: event.length });
        })
      : undefined;
    try {
      return (await nativeCall("speak", { ...rest, text, id })) as "finished" | "cancelled";
    } finally {
      remove?.();
    }
  },
  /** Stops now; pending `speak` promises resolve "cancelled". */
  async stop(): Promise<void> {
    await nativeCall("speechStop", {});
  },
  async pause(): Promise<void> {
    await nativeCall("speechPause", {});
  },
  async resume(): Promise<void> {
    await nativeCall("speechResume", {});
  },
  async voices(): Promise<{ id: string; name: string; language: string; quality: "default" | "enhanced" | "premium" }[]> {
    return (await nativeCall("speechVoices", {})) as any;
  },
};

// MARK: Keep awake

let keepAwakeCount = 0;

/** Keeps the screen from auto-locking while any caller holds it; returns a release function. */
export function keepAwake(): () => void {
  if (keepAwakeCount++ === 0) void nativeCall("keepAwake", { on: true });
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--keepAwakeCount === 0) void nativeCall("keepAwake", { on: false });
  };
}

/** Keeps the screen awake while mounted (and `active`). */
export function useKeepAwake(active = true) {
  useEffect(() => (active ? keepAwake() : undefined), [active]);
}

// MARK: Geolocation

export type GeolocationCoordinates = {
  latitude: number;
  longitude: number;
  /** Meters. */
  accuracy: number;
  altitude: number | null;
  altitudeAccuracy: number | null;
  /** Degrees clockwise from north, while moving. */
  heading: number | null;
  /** Meters per second. */
  speed: number | null;
};
export type GeolocationPosition = { coords: GeolocationCoordinates; timestamp: number };
export type GeolocationPositionError = { code: 1 | 2 | 3; message: string; PERMISSION_DENIED: 1; POSITION_UNAVAILABLE: 2; TIMEOUT: 3 };
export type PositionOptions = { enableHighAccuracy?: boolean; timeout?: number; maximumAge?: number };

function positionError(code: 1 | 2 | 3, message: string): GeolocationPositionError {
  return { code, message, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 };
}

let nextWatch = 1;
const watches = new Map<number, () => void>();

/**
 * The web's `navigator.geolocation` on Core Location. Asks for when-in-use
 * permission the first time (the app needs `NSLocationWhenInUseUsageDescription`
 * in its Info.plist).
 */
export const geolocation = {
  getCurrentPosition(
    success: (position: GeolocationPosition) => void,
    error?: (error: GeolocationPositionError) => void,
    options: PositionOptions = {},
  ) {
    let done = false;
    const timer =
      options.timeout !== undefined && options.timeout !== Infinity
        ? setTimeout(() => {
            if (done) return;
            done = true;
            error?.(positionError(3, "Timeout expired"));
          }, options.timeout)
        : undefined;
    void nativeCall("locationGet", { enableHighAccuracy: options.enableHighAccuracy, maximumAge: options.maximumAge ?? 0 }).then((result: any) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (result?.error) error?.(positionError(result.error.code, result.error.message));
      else success(result as GeolocationPosition);
    });
  },
  watchPosition(
    success: (position: GeolocationPosition) => void,
    error?: (error: GeolocationPositionError) => void,
    options: PositionOptions = {},
  ): number {
    const id = nextWatch++;
    const removePosition = listen("location", (position: GeolocationPosition) => success(position));
    const removeError = listen("locationError", (e: { code: 1 | 2 | 3; message: string }) => error?.(positionError(e.code, e.message)));
    watches.set(id, () => {
      removePosition();
      removeError();
    });
    void nativeCall("locationWatch", { id, enableHighAccuracy: options.enableHighAccuracy });
    return id;
  },
  clearWatch(id: number) {
    const remove = watches.get(id);
    if (!remove) return;
    remove();
    watches.delete(id);
    void nativeCall("locationClear", { id });
  },
};
(globalThis as any).navigator.geolocation = geolocation;

/** The current position while mounted (watching it), and any error. */
export function useGeolocation(options: PositionOptions & { enabled?: boolean } = {}) {
  const [state, setState] = useState<{ position: GeolocationPosition | null; error: GeolocationPositionError | null }>({ position: null, error: null });
  const { enabled = true, enableHighAccuracy } = options;
  useEffect(() => {
    if (!enabled) return;
    const id = geolocation.watchPosition(
      (position) => setState({ position, error: null }),
      (error) => setState((s) => ({ ...s, error })),
      { enableHighAccuracy },
    );
    return () => geolocation.clearWatch(id);
  }, [enabled, enableHighAccuracy]);
  return state;
}
