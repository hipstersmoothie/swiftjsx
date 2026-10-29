// Worklets: functions that run on the main thread instead of the JS thread
// (see Sources/SwiftJSX/Worklets.swift). Mark one with a "worklet" directive;
// the build (cli/worklets-plugin.mjs) records its source and the variables
// it captures, and the main thread compiles it in its own small JS context.
//
//   const offset = useSharedValue({ x: 0, y: 0 });
//   const style = useAnimatedStyle(() => ({ offset: offset.value }));
//   <VStack
//     animatedStyle={style}
//     onDrag={(e) => { "worklet"; offset.value = e.translation; }}
//     onDragEnd={() => { "worklet"; offset.value = withSpring({ x: 0, y: 0 }); }}
//   />
//
// The drag handler runs inside the touch event and the view moves in the same
// frame, with no round trip through React.

import { useEffect, useState } from "react";
import type { AnimationSpec, Modifiers } from "./components";

declare const __native: { command(id: number, name: string, args: unknown, callback: number): void };

/** `closure` returns the captured variables (read when the worklet is sent). */
type Worklet = { code: string; closure: () => Record<string, unknown> };
type WorkletFunction = Function & { __worklet?: Worklet; __builtin?: string };

// Called by code the worklets Babel pass generates.
(globalThis as any).__swiftjsx_worklet = (fn: WorkletFunction, code: string, closure: () => Record<string, unknown>) => {
  fn.__worklet = { code, closure };
  return fn;
};

const send = (message: { type: string; id: number; [key: string]: unknown }) => __native.command(0, "worklet", message, 0);

// MARK: Shared values

/**
 * `value` reads and writes it. `get()` / `set(v)` do the same; prefer them in
 * components the React Compiler compiles, which treats writing a property of
 * a hook's return value as a mutation and skips the component.
 */
export type SharedValue<T> = { value: T; get(): T; set(value: T): void; readonly __shared: number };

class Shared<T> implements SharedValue<T> {
  constructor(readonly __shared: number, public _value: T) {}
  get value(): T {
    return this._value;
  }
  /** Assign a value, or an animation (`withSpring(…)`, `withTiming(…)`…). */
  set value(v: T) {
    this._value = isAnimation(v) ? (finalValue(v, this._value) as T) : v;
    send({ type: "set", id: this.__shared, value: isAnimation(v) ? serializeAnimation(v) : v });
  }
  get(): T {
    return this.value;
  }
  set(v: T) {
    this.value = v;
  }
}

let nextShared = 1;
const live = new Map<number, Shared<unknown>>();
/** Deleted on the main thread by an effect cleanup (sent again if the effect re-runs). */
const deleted = new Set<number>();

/** A shared value outside a component. Prefer `useSharedValue`. */
export function makeMutable<T>(initial: T): SharedValue<T> {
  const shared = new Shared(nextShared++, initial);
  live.set(shared.__shared, shared as Shared<unknown>);
  send({ type: "set", id: shared.__shared, value: initial });
  return shared;
}

/**
 * State that lives on the main thread, where worklets read and write it
 * synchronously. Writing it from the JS thread sends it there; reading it on
 * the JS thread gives the last value the main thread reported (async).
 * Changing it doesn't re-render React; `useAnimatedStyle` reacts to it instead.
 */
export function useSharedValue<T>(initial: T): SharedValue<T> {
  const [shared] = useState(() => makeMutable(initial) as Shared<T>);
  useEffect(() => {
    // Re-register after a cleanup (Fast Refresh re-runs effects after running
    // their cleanup). Not on mount: makeMutable already sent the value, and
    // sending it again could undo a worklet's write that got there first.
    live.set(shared.__shared, shared as Shared<unknown>);
    if (deleted.delete(shared.__shared)) {
      send({ type: "set", id: shared.__shared, value: shared._value });
    }
    return () => {
      live.delete(shared.__shared);
      deleted.add(shared.__shared);
      send({ type: "delete", id: shared.__shared });
    };
  }, [shared]);
  return shared;
}

// The main thread reports values that worklets wrote.
(globalThis as any).__swiftjsx_sharedValues = (values: Record<string, unknown>) => {
  for (const id in values) {
    const shared = live.get(Number(id));
    if (shared) shared._value = values[id];
  }
};

// MARK: Animations
//
// Assigned to a shared value, these run on the main thread, stepped every
// frame: worklets read the current value mid-animation, and the optional
// `callback(finished)` runs when it ends (`false` if something interrupted
// it). Values are numbers, or objects and arrays of numbers (`{ x, y }`).
// Values that aren't numbers (colors, booleans) are set at once and SwiftUI
// animates the change with the closest curve. Durations are in seconds.

type Animation<T> = { __animate: true; kind: string; to?: T; [key: string]: unknown };
const isAnimation = (v: unknown): v is Animation<unknown> => !!v && typeof v === "object" && (v as any).__animate === true;
type Callback = (finished: boolean) => void;

/** Where an animation ends, as far as the JS thread can tell (it hears the real value later). */
function finalValue(a: Animation<unknown>, from: unknown): unknown {
  switch (a.kind) {
    case "timing":
    case "spring":
      return a.to;
    case "delay":
      return finalValue(a.animation as Animation<unknown>, from);
    case "sequence":
      return (a.animations as Animation<unknown>[]).reduce((v, x) => finalValue(x, v), from);
    case "repeat": {
      const count = (a.count as number) ?? 2;
      return a.reverse && count % 2 === 0 ? from : finalValue(a.animation as Animation<unknown>, from);
    }
    default:
      return from;
  }
}

/** Callbacks inside become functions the main thread can call (once). */
function serializeAnimation(a: unknown): unknown {
  if (Array.isArray(a)) return a.map(serializeAnimation);
  if (!a || typeof a !== "object") return a;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(a)) {
    if (typeof value === "function") {
      const fn = value as WorkletFunction;
      out[key] = fn.__worklet ? serializeWorkletProp(fn, new Set()) : { __jsFunction: callOnce(fn), name: fn.name || "callback", callback: true };
    } else {
      out[key] = serializeAnimation(value);
    }
  }
  return out;
}

/** Marks a function as available on the main thread under the same name. */
function builtin<F extends Function>(name: string, fn: F): F {
  (fn as unknown as WorkletFunction).__builtin = name;
  return fn;
}

export type SpringConfig = {
  /** Perceptual duration in seconds, like SwiftUI's (default 0.5). */
  duration?: number;
  /** 0: no overshoot; 0.3: bouncy; negative: overdamped. */
  bounce?: number;
  /** Starting speed in units per second (a drag's `velocity`); default: the interrupted animation's. */
  velocity?: number | Record<string, number> | number[];
  delay?: number;
};

/** A spring to `to`. Interrupting a moving value keeps its speed. */
export const withSpring = builtin("withSpring", <T,>(to: T, config: SpringConfig = {}, callback?: Callback): T =>
  ({ __animate: true, kind: "spring", to, ...config, callback }) as unknown as T);

export type TimingConfig = {
  duration?: number;
  /** A named curve or cubic-bezier control points [x1, y1, x2, y2]. */
  easing?: "easeInOut" | "easeIn" | "easeOut" | "linear" | [number, number, number, number];
  delay?: number;
};

/** Along a curve to `to` in `duration` seconds (default 0.3, easeInOut). */
export const withTiming = builtin("withTiming", <T,>(to: T, config: TimingConfig = {}, callback?: Callback): T =>
  ({ __animate: true, kind: "timing", to, ...config, callback }) as unknown as T);

/**
 * Coasts from the current value at `velocity` (units per second), slowing
 * down (`deceleration` per millisecond, default 0.998) until it stops, or
 * stops at `clamp`'s bounds: a flick.
 */
export const withDecay = builtin("withDecay", <T = number,>(
  config: { velocity: number | Record<string, number>; deceleration?: number; clamp?: [number, number] },
  callback?: Callback,
): T => ({ __animate: true, kind: "decay", ...config, callback }) as unknown as T);

/** Starts `animation` after `delay` seconds. */
export const withDelay = builtin("withDelay", <T,>(delay: number, animation: T): T =>
  ({ __animate: true, kind: "delay", delay, animation }) as unknown as T);

/** Animations one after another, each from where the last one ended. */
export const withSequence = builtin("withSequence", <T,>(...animations: T[]): T =>
  ({ __animate: true, kind: "sequence", animations }) as unknown as T);

/**
 * `animation` `count` times (-1: forever); `reverse` plays every other round
 * backwards (a pulse, a wiggle). `callback` runs when the last round ends.
 */
export const withRepeat = builtin("withRepeat", <T,>(animation: T, count = 2, reverse = false, callback?: Callback): T =>
  ({ __animate: true, kind: "repeat", animation, count, reverse, callback }) as unknown as T);

/** Stops a shared value's animation where it is (its callback gets `false`). */
export const cancelAnimation = builtin("cancelAnimation", (value: SharedValue<unknown>) => {
  send({ type: "cancel", id: value.__shared });
});

/**
 * Calls a JS-thread function (e.g. a state setter) from a worklet. It runs
 * after the worklet, on the JS thread, and sees the shared values the worklet
 * wrote; the call returns undefined. (Calling a JS-thread function directly
 * from a worklet does the same, with a warning: it's usually a helper that's
 * missing its "worklet" directive.)
 */
export const runOnJS = builtin("runOnJS", <A extends unknown[]>(fn: (...args: A) => unknown) => fn as (...args: A) => void);

// MARK: Derived values and reactions

let nextReaction = 1;
const newReactionId = () => nextReaction++;

/**
 * A shared value computed on the main thread from other shared values; it
 * updates (without rendering React) when they change. The callback is a
 * worklet automatically. It may return an animation (`withSpring(…)`).
 */
export function useDerivedValue<T>(fn: () => T): SharedValue<T> {
  const shared = useSharedValue<T>(undefined as T);
  const worklet = fn as WorkletFunction;
  if (!worklet.__worklet) throw new Error("useDerivedValue: the callback wasn't compiled as a worklet.");
  useEffect(() => {
    send({ type: "derive", id: shared.__shared, worklet: serializeWorkletProp(fn, retained) });
  }, [shared, fn]);
  return shared;
}

/**
 * Runs `react(current, previous)` on the main thread when `prepare()`'s
 * result changes; `prepare` reads shared values (and re-runs when they
 * change). Both are worklets automatically. Call `runOnJS(fn)(…)` from
 * `react` to tell React.
 */
export function useAnimatedReaction<T>(prepare: () => T, react: (current: T, previous: T | null) => void) {
  const [id] = useState(newReactionId);
  if (!(prepare as WorkletFunction).__worklet || !(react as WorkletFunction).__worklet) {
    throw new Error("useAnimatedReaction: the callbacks weren't compiled as worklets.");
  }
  useEffect(() => {
    send({ type: "react", id, prepare: serializeWorkletProp(prepare, retained), react: serializeWorkletProp(react, retained) });
    return () => send({ type: "unreact", id });
  }, [id, prepare, react]);
}

// MARK: Animated styles

/** Props an animated style can set: the modifiers, minus handlers and refs. */
export type AnimatableProps = Partial<
  Pick<
    Modifiers,
    | "padding" | "frame" | "background" | "foregroundStyle" | "cornerRadius" | "border" | "shadow" | "opacity"
    | "offset" | "scale" | "rotation" | "disabled" | "blur"
  >
>;

export type AnimatedStyle = { readonly __animatedStyle: WorkletFunction };

/**
 * Props computed on the main thread from shared values; pass the result as
 * `animatedStyle`. The function re-runs whenever a shared value it read
 * changes, without rendering React. The props it returns override the
 * element's own props with the same name.
 *
 * The callback is a worklet automatically: it can only use shared values,
 * constants and other worklets it captures.
 */
export function useAnimatedStyle(fn: () => AnimatableProps): AnimatedStyle {
  if (!(fn as WorkletFunction).__worklet) {
    throw new Error("useAnimatedStyle: the callback wasn't compiled as a worklet. Build with scripts/build.mjs, which runs the worklets Babel pass.");
  }
  return { __animatedStyle: fn as WorkletFunction };
}

// MARK: Serialization (used by the renderer)

const jsFunctions = new Map<number, Function>();
const functionIds = new WeakMap<Function, number>();
const functionRefs = new Map<number, number>();
let nextFunction = 1;

/** Whether a prop value is a worklet (or an animated style) to send to the main thread. */
export function isWorkletProp(v: unknown): boolean {
  return (typeof v === "function" && !!(v as WorkletFunction).__worklet) || (!!v && typeof v === "object" && "__animatedStyle" in v);
}

/** `{ __worklet: { code, closure } }`, with captured values made sendable. JS functions it captures are added to `ids`. */
export function serializeWorkletProp(v: unknown, ids: Set<number>): unknown {
  const fn = (typeof v === "function" ? v : (v as AnimatedStyle).__animatedStyle) as WorkletFunction;
  const { code, closure: read } = fn.__worklet!;
  const closure = read();
  const out: Record<string, unknown> = {};
  for (const key in closure) out[key] = serializeCaptured(closure[key], ids);
  return { __worklet: { code, closure: out } };
}

function serializeCaptured(v: unknown, ids: Set<number>): unknown {
  if (v instanceof Shared) return { __shared: v.__shared };
  if (typeof v === "function") {
    const fn = v as WorkletFunction;
    if (fn.__builtin) return { __builtin: fn.__builtin };
    if (fn.__worklet) return serializeWorkletProp(fn, ids);
    let id = functionIds.get(fn);
    if (id === undefined) functionIds.set(fn, (id = nextFunction++));
    jsFunctions.set(id, fn);
    ids.add(id);
    return { __jsFunction: id, name: fn.name || "anonymous" };
  }
  if (Array.isArray(v)) return v.map((x) => serializeCaptured(x, ids));
  if (v && typeof v === "object") {
    if (Object.getPrototypeOf(v) !== Object.prototype) {
      throw new Error(`A worklet captured a ${v.constructor?.name ?? "non-plain"} object; worklets can capture plain data, shared values and functions.`);
    }
    const out: Record<string, unknown> = {};
    for (const key in v) out[key] = serializeCaptured((v as Record<string, unknown>)[key], ids);
    return out;
  }
  return v;
}

/** Keeps the JS functions a host instance's worklets capture callable from the main thread. */
export function retainFunctions(previous: Set<number> | undefined, next: Set<number>) {
  for (const id of next) functionRefs.set(id, (functionRefs.get(id) ?? 0) + 1);
  for (const id of previous ?? []) {
    const refs = (functionRefs.get(id) ?? 1) - 1;
    if (refs > 0) functionRefs.set(id, refs);
    else {
      functionRefs.delete(id);
      jsFunctions.delete(id);
    }
  }
}

export function jsFunction(id: number): Function | undefined {
  return jsFunctions.get(id);
}

/** JS functions that derived values and reactions capture: kept while the app runs. */
const retained = new Set<number>();

/** An id for a function the main thread calls once (an animation's callback). */
function callOnce(fn: Function): number {
  const id = nextFunction++;
  jsFunctions.set(id, (...args: unknown[]) => {
    jsFunctions.delete(id);
    return fn(...args);
  });
  return id;
}
