// Worklets: functions that run on the main thread instead of the JS thread
// (see Sources/SwiftJSX/Worklets.swift). Mark one with a "worklet" directive;
// the build (scripts/worklets-plugin.mjs) records its source and the variables
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

const send = (message: { type: "set" | "delete"; id: number; value?: unknown }) =>
  __native.command(0, "worklet", message, 0);

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
  /** Assign a value, or an animation (`withSpring(…)`, `withTiming(…)`). */
  set value(v: T) {
    this._value = isAnimation(v) ? (v.to as T) : v;
    send({ type: "set", id: this.__shared, value: v });
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
    // (Re-)register: Fast Refresh re-runs effects after running their cleanup.
    live.set(shared.__shared, shared as Shared<unknown>);
    send({ type: "set", id: shared.__shared, value: shared._value });
    return () => {
      live.delete(shared.__shared);
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

type Animation<T> = { __animate: true; to: T; animation: AnimationSpec };
const isAnimation = (v: unknown): v is Animation<unknown> => !!v && typeof v === "object" && (v as any).__animate === true;

/** Marks a function as available on the main thread under the same name. */
function builtin<F extends Function>(name: string, fn: F): F {
  (fn as unknown as WorkletFunction).__builtin = name;
  return fn;
}

/**
 * Assign to a shared value to animate there with a spring. SwiftUI runs the
 * animation natively (and keeps velocity when it's retargeted mid-flight).
 */
export const withSpring = builtin("withSpring", <T,>(to: T, config?: { duration?: number; bounce?: number }): T =>
  ({ __animate: true, to, animation: { type: "spring", ...config } }) as unknown as T);

/** Assign to a shared value to animate there along a curve. Seconds. */
export const withTiming = builtin(
  "withTiming",
  <T,>(to: T, config: { duration?: number; easing?: "easeInOut" | "easeIn" | "easeOut" | "linear"; delay?: number } = {}): T =>
    ({
      __animate: true,
      to,
      animation: { type: config.easing ?? "easeInOut", duration: config.duration ?? 0.3, delay: config.delay },
    }) as unknown as T,
);

/**
 * Calls a JS-thread function (e.g. a state setter) from a worklet. It runs
 * after the worklet, on the JS thread, and sees the shared values the worklet
 * wrote; the call returns undefined. (Calling a JS-thread function directly
 * from a worklet does the same, with a warning: it's usually a helper that's
 * missing its "worklet" directive.)
 */
export const runOnJS = builtin("runOnJS", <A extends unknown[]>(fn: (...args: A) => unknown) => fn as (...args: A) => void);

// MARK: Animated styles

/** Props an animated style can set: the modifiers, minus handlers and refs. */
export type AnimatableProps = Partial<
  Pick<
    Modifiers,
    | "padding" | "frame" | "background" | "foregroundStyle" | "cornerRadius" | "border" | "shadow" | "opacity"
    | "offset" | "scale" | "rotation" | "disabled"
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
