// A React renderer whose "host" is SwiftUI.
//
// React does all the work (components, hooks, reconciliation). This file only
// translates the reconciler's mutations (create / append / insert / remove /
// update) into a flat list of ops, and hands that list to Swift once per commit.
// Swift owns the actual view tree and renders it with SwiftUI.

import Reconciler from "react-reconciler";
import {
  DefaultEventPriority,
  DiscreteEventPriority,
  NoEventPriority,
} from "react-reconciler/constants";
import { createContext, type ReactNode } from "react";
import type { AnimationSpec } from "./components";
import { isWorkletProp, jsFunction, retainFunctions, serializeWorkletProp } from "./worklets";

type Props = Record<string, any>;
type TextInstance = { id: number; text: string };
type Container = { id: 0 };

export type Op =
  | { op: "create"; id: number; type: string; props: Props }
  | { op: "text"; id: number; text: string }
  | { op: "append"; parent: number; child: number }
  | { op: "insert"; parent: number; child: number; before: number }
  | { op: "remove"; parent: number; child: number }
  | { op: "update"; id: number; props: Props }
  | { op: "setText"; id: number; text: string };

// Provided by Swift (see JSEngine.swift).
declare const __native: {
  /** `completion` > 0: call `__resolveCommand(completion)` when the animation finishes. */
  commit(ops: Op[], animation?: AnimationSpec, completion?: number): void;
  /** Imperative call on a native view; `callback` > 0 expects `__resolveCommand`. */
  command(id: number, name: string, args: unknown, callback: number): void;
  log(level: string, message: string): void;
  /** Show the red-box error overlay. */
  fatal(message: string): void;
};

export type Frame = { x: number; y: number; width: number; height: number };
export type ScrollTarget = HostInstance | number | "top" | "end" | { x?: number; y?: number };
export type ScrollOptions = { animated?: boolean; anchor?: "top" | "center" | "bottom" | "leading" | "trailing" };

/**
 * What a `ref` on a host component points at. The imperative methods are
 * forwarded to the SwiftUI view.
 */
export class HostInstance {
  /** Sequence number of the last native event delivered to this node… */
  eventSeq: number | undefined;
  /** …and the last one Swift has been told about. */
  ackedSeq: number | undefined;
  /** Text the native input showed in its last onChange (before any rebase). */
  nativeText: string | undefined;
  /** Serialized worklet props, to diff by content (closures change, functions don't compare). */
  worklets: Map<string, string> | undefined;
  /** JS functions captured by this instance's worklets (callable from the main thread). */
  functionIds: Set<number> | undefined;
  constructor(readonly id: number, readonly type: string, public props: Props) {}

  /** Focus a TextField. */
  focus() {
    __native.command(this.id, "focus", null, 0);
  }
  blur() {
    __native.command(this.id, "blur", null, 0);
  }
  /** Move a TextField's cursor (or select `start`–`end`), in UTF-16 offsets; focuses it. */
  setSelection(start: number, end = start) {
    // After React commits any text change made in the same handler (its sync
    // work runs in a microtask queued before this one), so the offsets match.
    queueMicrotask(() => __native.command(this.id, "setSelection", { start, end }, 0));
  }
  /**
   * Scroll a ScrollView, VirtualList, List or Form. `target` is a ref to a
   * descendant (in a List or Form, its row), a child or row index,
   * "top" / "end", or a content offset `{ x, y }` (ScrollView, VirtualList).
   */
  scrollTo(target: ScrollTarget, options: ScrollOptions = {}) {
    const resolved =
      target instanceof HostInstance ? { node: target.id }
      : typeof target === "number" ? { index: target }
      : typeof target === "object" ? { offset: target }
      : { edge: target };
    __native.command(this.id, "scrollTo", { ...resolved, animated: options.animated ?? true, anchor: options.anchor ?? null }, 0);
  }
  /** Frame in window coordinates, after the last layout. */
  measure(): Promise<Frame> {
    return new Promise((resolve) => {
      const cb = nextCallback++;
      callbacks.set(cb, resolve as (v: unknown) => void);
      __native.command(this.id, "measure", null, cb);
    });
  }
}

let nextId = 1;
let nextCallback = 1;

/** A command to the native side that answers (on the JS thread) with a value. */
export function nativeCall(name: string, args: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    const cb = nextCallback++;
    callbacks.set(cb, resolve);
    __native.command(0, name, args, cb);
  });
}
let pending: Op[] = [];
const instances = new Map<number, HostInstance>();
const callbacks = new Map<number, (value: unknown) => void>();

// Functions can't cross the bridge. Swift sees `onPress: true` and calls back
// into __dispatch(id, "onPress", payload); we look up the live handler here.
// Worklets (and animated styles) are the exception: they're sent as code plus
// captured values, to run on the main thread.
function serialize(inst: HostInstance, props: Props): Props {
  const out: Props = {};
  for (const key in props) {
    if (key === "children" || key === "key" || key === "ref") continue;
    const v = props[key];
    if (v === undefined || isWorkletProp(v)) continue;
    out[key] = typeof v === "function" ? true : v;
  }
  Object.assign(out, serializeWorklets(inst, props));
  // Swift only tracks layout (for measure()) on nodes that have a ref.
  if (props.ref != null) out.__ref = true;
  return out;
}

/** Serializes the worklet props, and returns the ones whose content changed since last time. */
function serializeWorklets(inst: HostInstance, props: Props): Props {
  const ids = new Set<number>();
  const changed: Props = {};
  const json = new Map<string, string>();
  for (const key in props) {
    if (!isWorkletProp(props[key])) continue;
    const value = serializeWorkletProp(props[key], ids);
    const text = JSON.stringify(value);
    json.set(key, text);
    if (inst.worklets?.get(key) !== text) changed[key] = value;
  }
  if (ids.size || inst.functionIds?.size) retainFunctions(inst.functionIds, ids);
  inst.functionIds = ids;
  inst.worklets = json.size ? json : undefined;
  return changed;
}

// `frame={{ width: 10 }}` is a new object every render; compare by value so we
// don't send (and SwiftUI doesn't re-render) props that didn't really change.
function same(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a === "function" && typeof b === "function") return true;
  if (a && b && typeof a === "object" && typeof b === "object") {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  return false;
}

function shallowDiff(inst: HostInstance, oldProps: Props, newProps: Props): Props | null {
  const changed: Props = serializeWorklets(inst, newProps);
  let any = Object.keys(changed).length > 0;
  for (const key in newProps) {
    if (key === "children" || key === "ref" || isWorkletProp(newProps[key])) continue;
    if (!same(oldProps[key], newProps[key]) || isWorkletProp(oldProps[key])) {
      // `undefined` doesn't survive the bridge; null tells Swift to drop the prop.
      const v = newProps[key];
      changed[key] = typeof v === "function" ? true : v === undefined ? null : v;
      any = true;
    }
  }
  for (const key in oldProps) {
    if (key === "children" || key === "ref") continue;
    if (!(key in newProps)) {
      changed[key] = null;
      any = true;
    }
  }
  if ((oldProps.ref != null) !== (newProps.ref != null)) {
    changed.__ref = newProps.ref != null ? true : null;
    any = true;
  }
  return any ? changed : null;
}

let currentPriority: number = NoEventPriority;

const hostConfig: any = {
  rendererPackageName: "swiftjsx",
  rendererVersion: "0.1.0",
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,
  isPrimaryRenderer: true,
  supportsMicrotasks: true,
  scheduleMicrotask: (fn: () => void) => Promise.resolve().then(fn),
  scheduleTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
  cancelTimeout: (id: number) => clearTimeout(id),
  noTimeout: -1,
  warnsIfNotActing: false,

  createInstance(type: string, props: Props): HostInstance {
    const inst = new HostInstance(nextId++, type, props);
    instances.set(inst.id, inst);
    pending.push({ op: "create", id: inst.id, type, props: serialize(inst, props) });
    return inst;
  },
  createTextInstance(text: string): TextInstance {
    const inst = { id: nextId++, text };
    pending.push({ op: "text", id: inst.id, text });
    return inst;
  },
  appendInitialChild(parent: HostInstance, child: HostInstance | TextInstance) {
    pending.push({ op: "append", parent: parent.id, child: child.id });
  },
  appendChild(parent: HostInstance, child: HostInstance | TextInstance) {
    pending.push({ op: "append", parent: parent.id, child: child.id });
  },
  appendChildToContainer(_: Container, child: HostInstance | TextInstance) {
    pending.push({ op: "append", parent: 0, child: child.id });
  },
  insertBefore(parent: HostInstance, child: HostInstance | TextInstance, before: HostInstance | TextInstance) {
    pending.push({ op: "insert", parent: parent.id, child: child.id, before: before.id });
  },
  insertInContainerBefore(_: Container, child: HostInstance | TextInstance, before: HostInstance | TextInstance) {
    pending.push({ op: "insert", parent: 0, child: child.id, before: before.id });
  },
  removeChild(parent: HostInstance, child: HostInstance | TextInstance) {
    pending.push({ op: "remove", parent: parent.id, child: child.id });
  },
  removeChildFromContainer(_: Container, child: HostInstance | TextInstance) {
    pending.push({ op: "remove", parent: 0, child: child.id });
  },
  commitUpdate(inst: HostInstance, _type: string, oldProps: Props, newProps: Props) {
    inst.props = newProps;
    const diff = shallowDiff(inst, oldProps, newProps);
    if (!diff) return;
    // Lets controlled native inputs ignore stale echoes (see Controlled.swift).
    if (inst.eventSeq !== undefined) diff.__seq = inst.ackedSeq = inst.eventSeq;
    pending.push({ op: "update", id: inst.id, props: diff });
  },
  commitTextUpdate(inst: TextInstance, _old: string, text: string) {
    inst.text = text;
    pending.push({ op: "setText", id: inst.id, text });
  },
  detachDeletedInstance(inst: HostInstance) {
    instances.delete(inst.id);
    if (inst.functionIds?.size) retainFunctions(inst.functionIds, new Set());
  },
  clearContainer() {},
  resetTextContent() {},
  shouldSetTextContent: () => false,
  finalizeInitialChildren: () => false,
  getRootHostContext: () => ({}),
  getChildHostContext: (ctx: unknown) => ctx,
  getPublicInstance: (inst: HostInstance) => inst,
  prepareForCommit: () => null,
  resetAfterCommit() {
    const ops = pending;
    pending = [];
    if (!ops.length) return;
    __native.commit(ops, commitAnimation, commitCompletion);
    commitCompletion = 0;
  },
  preparePortalMount() {},
  hideInstance(inst: HostInstance) {
    pending.push({ op: "update", id: inst.id, props: { hidden: true } });
  },
  unhideInstance(inst: HostInstance) {
    pending.push({ op: "update", id: inst.id, props: { hidden: null } });
  },
  hideTextInstance() {},
  unhideTextInstance() {},
  getInstanceFromNode: () => null,
  beforeActiveInstanceBlur() {},
  afterActiveInstanceBlur() {},
  prepareScopeUpdate() {},
  getInstanceFromScope: () => null,

  // Update priorities: native events are "discrete" (like a click on the web),
  // so state updates from them render before the event handler returns.
  setCurrentUpdatePriority(p: number) {
    currentPriority = p;
  },
  getCurrentUpdatePriority: () => currentPriority,
  resolveUpdatePriority: () => currentPriority || DefaultEventPriority,
  resolveEventType: () => null,
  resolveEventTimeStamp: () => -1.1,
  trackSchedulerEvent() {},
  shouldAttemptEagerTransition: () => false,
  requestPostPaintCallback() {},

  // Suspense-y commit hooks: we never suspend a commit.
  maySuspendCommit: () => false,
  maySuspendCommitOnUpdate: () => false,
  maySuspendCommitInSyncRender: () => false,
  preloadInstance: () => true,
  startSuspendingCommit() {},
  suspendInstance() {},
  waitForCommitToBeReady: () => null,
  getSuspendedCommitReason: () => null,

  NotPendingTransition: null,
  HostTransitionContext: createContext(null),
  resetFormInstance() {},
  bindToConsole: (methodName: string, args: unknown[]) =>
    (console as any)[methodName].bind(console, ...args),
};

const reconciler = Reconciler(hostConfig);

let commitAnimation: AnimationSpec | undefined;
/** Callback id for the next animated commit's completion (0: none). */
let commitCompletion = 0;

/**
 * Like SwiftUI's `withAnimation`: state updates made in `fn` render right
 * away (as with `flushSync`), and SwiftUI animates everything that commit
 * changes: layout, insertions with a `transition`, colors, offsets…
 *
 *   withAnimation("spring", () => setExpanded(true));
 *   withAnimation({ type: "easeInOut", duration: 0.6 }, () => setStep(2));
 *
 * `completion` runs once the animation has finished (SwiftUI's "logically
 * complete": a spring counts once it's close to rest), or right away if `fn`
 * changed nothing:
 *
 *   withAnimation("spring", () => setGhosts(merged), () => setGhosts([]));
 *   await new Promise((done) => withAnimation("bouncy", () => setOpen(false), done));
 */
export function withAnimation<T>(animation: AnimationSpec, fn: () => T, completion?: () => void): T {
  const previous = commitAnimation;
  const previousCompletion = commitCompletion;
  commitAnimation = animation;
  commitCompletion = 0;
  if (completion) {
    commitCompletion = nextCallback++;
    callbacks.set(commitCompletion, () => completion());
  }
  const pendingCompletion = commitCompletion;
  try {
    return (reconciler as any).flushSyncFromReconciler(fn);
  } finally {
    // Nothing committed: nothing to wait for.
    if (pendingCompletion && commitCompletion === pendingCompletion) {
      callbacks.delete(pendingCompletion);
      queueMicrotask(completion!);
    }
    commitAnimation = previous;
    commitCompletion = previousCompletion;
  }
}
// Registers with the React Refresh hook (installed by refresh-setup.ts).
(reconciler as any).injectIntoDevTools();

// Called by Swift when a native control fires an event. `seq` is set for
// events from controlled inputs.
// `callback` (onRefresh…): Swift waits until the handler's promise settles.
(globalThis as any).__dispatch = (id: number, event: string, payload: unknown, seq?: number, callback?: number) => {
  const inst = instances.get(id);
  const handler = inst?.props[event];
  if (seq != null && inst) {
    inst.eventSeq = seq;
    acknowledgeLater(inst, seq);
    if (event === "onChange" && typeof payload === "string") payload = rebase(inst, payload);
  }
  const done = () => callback != null && __native.command(0, "eventDone", { callback }, 0);
  if (typeof handler !== "function") return done();
  const prev = currentPriority;
  currentPriority = DiscreteEventPriority;
  let result: unknown;
  try {
    result = handler(payload);
  } catch (error) {
    done();
    throw error;
  } finally {
    currentPriority = prev;
  }
  if (callback != null) Promise.resolve(result).then(done, (error) => {
    done();
    console.error(error instanceof Error ? `${error.message}\n${error.stack}` : String(error));
  });
};

/**
 * Opens a URL: web links in Safari, or in an in-app Safari sheet with
 * `{ inApp: true }`; other schemes (tel:, mailto:, app links) with the system.
 * Resolves to whether it opened.
 */
export async function openURL(url: string, options: { inApp?: boolean } = {}): Promise<boolean> {
  return (await nativeCall("openURL", { url: String(url), inApp: !!options.inApp })) as boolean;
}

/**
 * Whether something on the device can open the URL. Schemes other than
 * http(s) must be listed in the app's LSApplicationQueriesSchemes.
 */
export async function canOpenURL(url: string): Promise<boolean> {
  return (await nativeCall("canOpenURL", { url: String(url) })) as boolean;
}

// Typing faster than the JS round trip: the input builds each keystroke on
// what it shows, which may be text React rejected or transformed ("12a" when
// the field only accepts digits). React DOM restores the field before the next
// keystroke; here we do the equivalent by moving the new keystrokes onto
// React's value: "12a" → rejected, value "12"; then "12a3" becomes "123".
function rebase(inst: HostInstance, text: string): string {
  const shown = inst.nativeText;
  const value = inst.props.value;
  inst.nativeText = text;
  if (shown === undefined || typeof value !== "string" || shown === value || !text.startsWith(shown)) return text;
  return value + text.slice(shown.length);
}

// A controlled input's edit is acknowledged by the commit that renders it
// (`__seq` above). If the handler rejects the edit (no state change, or the
// same value), nothing commits, so acknowledge it on its own: the input then
// goes back to showing its `value` prop, like a controlled input in React DOM.
// Runs after React's microtask that flushes the event's synchronous updates.
function acknowledgeLater(inst: HostInstance, seq: number) {
  Promise.resolve().then(() => {
    if (!instances.has(inst.id) || inst.eventSeq !== seq || (inst.ackedSeq ?? 0) >= seq) return;
    inst.ackedSeq = seq;
    __native.commit([{ op: "update", id: inst.id, props: { __seq: seq } }]);
  });
}

// A worklet called a JS-thread function (e.g. a state setter).
(globalThis as any).__swiftjsx_callJS = (id: number, args: unknown[]) => {
  const fn = jsFunction(id);
  if (!fn) return;
  const prev = currentPriority;
  currentPriority = DiscreteEventPriority;
  try {
    fn(...args);
  } finally {
    currentPriority = prev;
  }
};

(globalThis as any).__resolveCommand = (cb: number, value: unknown) => {
  callbacks.get(cb)?.(value);
  callbacks.delete(cb);
};

const describe = (e: unknown) => (e instanceof Error ? `${e.message}\n${e.stack}` : String(e));
const onUncaught = (e: unknown) => __native.fatal(describe(e));
const onCaught = (e: unknown) => console.error(describe(e));

let root: unknown = null;

/**
 * Mount the app. Calling it again (which happens when a hot update re-runs
 * your bundle) is a no-op; React Refresh swaps the components in place.
 */
export function render(element: ReactNode) {
  if (root) return;
  // @types/react-reconciler lags the 0.34 signature, so call it untyped.
  root = (reconciler.createContainer as any)(
    { id: 0 },
    1, // ConcurrentRoot
    null,
    false,
    null,
    "",
    onUncaught,
    onCaught,
    onCaught,
    () => {},
  );
  // Mount synchronously so the first SwiftUI frame isn't blank. Later updates
  // are scheduled normally (concurrent features, transitions, Suspense all work).
  reconciler.updateContainerSync(element, root as any, null, null);
  reconciler.flushSyncWork();
}
