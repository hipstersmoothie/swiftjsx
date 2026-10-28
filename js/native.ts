// The optional `native` backend: every Objective-C class, protocol, C function
// and constant in the SDK, via NativeScript (see JSXRuntime(native:)).
//
// Threading: JS runs on SwiftJSX's JS thread. Most of UIKit is main-thread
// only — wrap those calls in `onMain(() => ...)`. Native callbacks that fire on
// the main thread (delegates, target-action, UIKit blocks) already run there.
// With the main-thread guard enabled, a stray off-main UIKit call throws.

import { useEffect, useEffectEvent, useState } from "react";
import type { NativeNamespace } from "./native-namespace";

/** NativeScript's globals: `native.UIDevice`, `native.CGRectMake`, `native.interop`, … */
export type Native = NativeNamespace;

const host = globalThis as any;

/** Whether this runtime was created with the native backend. */
export function isNativeAvailable(): boolean {
  return host.native != null;
}

/**
 * All of the SDK, as `native.UIDevice.currentDevice.model` etc. Throws a helpful
 * error if the runtime was created without the native backend.
 */
export const native: Native = new Proxy({} as Native, {
  get(_target, key) {
    const n = host.native;
    if (n == null) {
      throw new Error(
        `native.${String(key)}: the native backend is off. Create the runtime with ` +
          "JSXRuntime(…, native: NativeOptions(addonURL: …)) (iOS: NativeOptions.embedded).",
      );
    }
    return n[key];
  },
  has(_target, key) {
    return host.native != null && key in host.native;
  },
});

/**
 * Run `fn` on the main thread (for UIKit and other main-thread-only API) and
 * get its result back. The promise settles on the JS thread, so code after
 * `await` (and any React work it triggers) stays off the main thread.
 * Keep `fn` short: the main thread is busy while it runs.
 */
export function onMain<T>(fn: () => T): Promise<T> {
  const hop = host.__swiftjsx_mainHop;
  if (typeof hop !== "function") {
    return Promise.reject(new Error("onMain() needs the native backend (JSXRuntime(…, native: …))"));
  }
  return new Promise<T>((resolve, reject) => {
    hop(
      () => {
        try {
          return { ok: true, value: fn() };
        } catch (error) {
          return { ok: false, error };
        }
      },
      (result: { ok: boolean; value?: T; error?: unknown }) => (result.ok ? resolve(result.value as T) : reject(result.error)),
    );
  });
}

/**
 * The other direction: run `fn` on the JS thread, from a native callback
 * that runs on main (a notification observer, an AVPlayer time observer, a
 * remote command handler, a completion block…). State updates (React,
 * zustand) belong on the JS thread. Resolves with `fn`'s result.
 *
 *   center.addObserverForNameObjectQueueUsingBlock(name, null, null,
 *     (note) => { const id = note.object.id; onJS(() => setItem(id)); });
 */
export function onJS<T>(fn: () => T): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(fn());
      } catch (error) {
        reject(error);
      }
    }, 0);
  });
}

/** `fn` wrapped to always run on the JS thread (for native callbacks). Arguments are passed through. */
export function toJS<A extends unknown[]>(fn: (...args: A) => unknown): (...args: A) => void {
  return (...args: A) => void onJS(() => fn(...args));
}

export type NativeValueOptions = {
  /** Re-read when any of these NSNotifications is posted. */
  notifications?: string | string[];
  /** Re-read every `poll` ms as well. */
  poll?: number;
  /** Read on the main thread (default true: most of UIKit requires it). */
  mainThread?: boolean;
};

/**
 * A native value as React state: read once on mount, then again whenever one
 * of `notifications` fires (and/or every `poll` ms). Returns `undefined` until
 * the first read completes.
 *
 *   const level = useNativeValue(() => native.UIDevice.currentDevice.batteryLevel,
 *     { notifications: "UIDeviceBatteryLevelDidChangeNotification" });
 */
export function useNativeValue<T>(read: () => T, options: NativeValueOptions = {}): T | undefined {
  const { notifications, poll, mainThread = true } = options;
  const [value, setValue] = useState<T | undefined>(undefined);
  const names = notifications == null ? [] : Array.isArray(notifications) ? notifications : [notifications];
  const key = names.join("|");
  // The latest `read` without resubscribing when callers pass inline closures.
  const readNow = useEffectEvent(() => read());

  useEffect(() => {
    let live = true;
    const refresh = () => {
      const result = mainThread ? onMain(readNow) : Promise.resolve().then(readNow);
      result.then((v) => live && setValue(() => v)).catch((e) => console.error(e));
    };
    refresh();

    const center = native.NSNotificationCenter.defaultCenter;
    // The observer block may fire on any thread (often main): just schedule a
    // refresh on the JS thread.
    const tokens = names.map((name) =>
      center.addObserverForNameObjectQueueUsingBlock(name, null, null, () => setTimeout(refresh, 0)),
    );
    const timer = poll ? setInterval(refresh, poll) : undefined;
    return () => {
      live = false;
      tokens.forEach((t) => center.removeObserver(t));
      if (timer) clearInterval(timer);
    };
  }, [key, poll, mainThread]);

  return value;
}

// MARK: Native classes

type MethodTable = Record<string, (this: any, ...args: any[]) => any>;
type ExposedType = "void" | "id" | "bool" | "int" | "double" | "string";

export type NativeClassSpec = {
  /** Superclass name (default "NSObject"). */
  extends?: string;
  /** Protocol names it adopts: ["AVSpeechSynthesizerDelegate"]. */
  protocols?: string[];
  /**
   * Methods by their JS name (selector parts joined, NativeScript style:
   * `speechSynthesizerDidFinishSpeechUtterance`). They run on the thread the
   * caller uses (delegates: usually main); hop with `onJS` / `toJS` to touch
   * React state.
   */
  methods: MethodTable;
  /**
   * Methods not in a protocol (target-action selectors): their types, keyed by
   * the selector as written (one colon per argument), e.g.
   * `{ "handleTap:": { returns: "void", params: ["id"] } }` with a
   * `"handleTap:"` method.
   */
  exposed?: Record<string, { returns: ExposedType; params?: ExposedType[] }>;
};

export type NativeClass = {
  /** A new instance (registers the class on first use). */
  "new"(): any;
  /** The registered class, for `isKindOfClass` and the like. */
  readonly class: any;
};

type Registered = { cls: any; table: MethodTable; selectors: string[] };

/**
 * Defines an Objective-C class from JS: a delegate, a target for
 * target-action. Safe at module level and across Fast Refresh: the class is
 * registered with the Objective-C runtime once per process (on first `new`;
 * nothing happens while the native backend is off), and redefining it swaps
 * in the new method bodies. Adding methods or protocols needs a full reload.
 *
 *   const Delegate = defineNativeClass("SpeechDelegate", {
 *     protocols: ["AVSpeechSynthesizerDelegate"],
 *     methods: {
 *       speechSynthesizerDidFinishSpeechUtterance(_s, utterance) { onJS(() => finished(utterance)) },
 *     },
 *   });
 *   synth.delegate = keepAlive(Delegate.new());
 */
export function defineNativeClass(name: string, spec: NativeClassSpec): NativeClass {
  const registry: Map<string, Registered> = (host.__swiftjsx_nativeClasses ??= new Map());
  const existing = registry.get(name);
  if (existing) {
    // Fast Refresh: same Objective-C class, new behavior.
    Object.assign(existing.table, spec.methods);
    const added = Object.keys(spec.methods).filter((key) => !existing.selectors.includes(key));
    if (added.length) console.warn(`defineNativeClass("${name}"): new methods (${added.join(", ")}) need a full reload`);
  }

  const register = (): Registered => {
    const known = registry.get(name);
    if (known?.cls) return known;
    const n = native as any;
    const Base = n[spec.extends ?? "NSObject"];
    if (!Base) throw new Error(`defineNativeClass("${name}"): no superclass ${spec.extends}`);
    const table: MethodTable = known?.table ?? { ...spec.methods };
    const Cls = { [name]: class extends Base {} }[name] as any;
    // Each method calls through the table, so a redefinition reaches it.
    for (const key of Object.keys(table)) {
      Cls.prototype[key] = function (this: any, ...args: any[]) {
        return table[key].apply(this, args);
      };
    }
    if (spec.protocols?.length) {
      Cls.ObjCProtocols = spec.protocols.map((p) => {
        const protocol = n[p];
        if (!protocol) throw new Error(`defineNativeClass("${name}"): no protocol ${p}`);
        return protocol;
      });
    }
    if (spec.exposed) {
      const t = n.interop.types;
      const type = (name: ExposedType) =>
        ({ void: t.void, id: t.id, bool: t.bool, int: t.int32, double: t.double, string: n.NSString })[name];
      Cls.ObjCExposedMethods = Object.fromEntries(
        Object.entries(spec.exposed).map(([key, sig]) => [key, { returns: type(sig.returns), params: (sig.params ?? []).map(type) }]),
      );
    }
    n.NativeClass(Cls);
    const entry = { cls: Cls, table, selectors: Object.keys(table) };
    registry.set(name, entry);
    return entry;
  };

  // Not registered yet: remember the methods for when it is.
  if (!existing) registry.set(name, { cls: null, table: { ...spec.methods }, selectors: Object.keys(spec.methods) });

  return {
    new: () => register().cls.new(),
    get class() {
      return register().cls;
    },
  };
}

const kept = new Set<unknown>();

/**
 * Holds a strong reference to a native object until the returned release
 * function runs (or forever). For `delegate` and `dataSource` properties,
 * which are weak: an object only they reference disappears.
 */
export function keepAlive<T>(object: T): T & { release(): void } {
  kept.add(object);
  return Object.assign(object as any, {
    release() {
      kept.delete(object);
    },
  });
}

/**
 * A Promise for a native completion handler that settles on the JS thread,
 * whichever queue the handler is called on:
 *
 *   const granted = await nativePromise<boolean>((resolve, reject) =>
 *     center.requestAuthorizationWithOptionsCompletionHandler(options, (ok, error) =>
 *       error ? reject(new Error(error.localizedDescription)) : resolve(ok)));
 */
export function nativePromise<T>(start: (resolve: (value: T) => void, reject: (error: unknown) => void) => void): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    try {
      start(toJS(resolve), toJS(reject));
    } catch (error) {
      reject(error);
    }
  });
}
