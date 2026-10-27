// Web platform APIs for app code and npm packages, installed as globals
// before React loads. The heavy lifting is native (WebHost.swift).

/// <reference path="./native.d.ts" />
import { AbortController, AbortSignal, CustomEvent, DOMException, Event, EventTarget } from "./events";
import { TextDecoder, TextEncoder, atob, btoa } from "./encoding";
import { URL, URLSearchParams } from "./url";
import { Blob, Headers, Request, Response, fetch } from "./fetch";
import { WebSocket, MessageEvent, CloseEvent } from "./websocket";

const g = globalThis as any;

// MARK: crypto

const integerArrays = [Int8Array, Uint8Array, Uint8ClampedArray, Int16Array, Uint16Array, Int32Array, Uint32Array, BigInt64Array, BigUint64Array];

const crypto = {
  getRandomValues<T extends ArrayBufferView>(array: T): T {
    if (!integerArrays.some((type) => array instanceof type)) {
      throw new DOMException("getRandomValues: the array must be an integer typed array", "TypeMismatchError");
    }
    if (array.byteLength > 65536) throw new DOMException("getRandomValues: more than 65536 bytes", "QuotaExceededError");
    __web.randomFill(array);
    return array;
  },
  randomUUID(): `${string}-${string}-${string}-${string}-${string}` {
    return __web.randomUUID() as any;
  },
};

// MARK: Storage

class Storage {
  constructor(private backing: { get(k: string): string | null; set(k: string, v: string): void; remove(k: string): void; clear(): void; keys(): string[] }) {}
  getItem(key: string): string | null {
    return this.backing.get(String(key));
  }
  setItem(key: string, value: string) {
    this.backing.set(String(key), String(value));
  }
  removeItem(key: string) {
    this.backing.remove(String(key));
  }
  clear() {
    this.backing.clear();
  }
  key(index: number): string | null {
    return this.backing.keys()[index] ?? null;
  }
  get length() {
    return this.backing.keys().length;
  }
}

/** Persisted across launches (UserDefaults). */
const localStorage = new Storage({
  get: (k) => __web.storage("get", k),
  set: (k, v) => __web.storage("set", k, v),
  remove: (k) => __web.storage("remove", k),
  clear: () => __web.storage("clear"),
  keys: () => __web.storage("keys"),
});

const session = new Map<string, string>();
/** For this launch only. */
const sessionStorage = new Storage({
  get: (k) => session.get(k) ?? null,
  set: (k, v) => void session.set(k, v),
  remove: (k) => void session.delete(k),
  clear: () => session.clear(),
  keys: () => [...session.keys()],
});

// MARK: structuredClone

function structuredClone<T>(value: T, seen = new Map<unknown, unknown>()): T {
  if (value === null || typeof value !== "object") {
    if (typeof value === "function" || typeof value === "symbol") {
      throw new DOMException(`${String(value)} could not be cloned.`, "DataCloneError");
    }
    return value;
  }
  if (seen.has(value)) return seen.get(value) as T;
  const v = value as any;
  let copy: any;
  if (v instanceof Date) copy = new Date(v.getTime());
  else if (v instanceof RegExp) copy = new RegExp(v.source, v.flags);
  else if (v instanceof ArrayBuffer) copy = v.slice(0);
  else if (ArrayBuffer.isView(v)) {
    const buffer = structuredClone(v.buffer, seen);
    copy = v instanceof DataView ? new DataView(buffer, v.byteOffset, v.byteLength)
      : new (v.constructor as any)(buffer, v.byteOffset, (v as any).length);
  } else if (v instanceof Map) {
    copy = new Map();
    seen.set(value, copy);
    v.forEach((val: unknown, key: unknown) => copy.set(structuredClone(key, seen), structuredClone(val, seen)));
    return copy;
  } else if (v instanceof Set) {
    copy = new Set();
    seen.set(value, copy);
    v.forEach((val: unknown) => copy.add(structuredClone(val, seen)));
    return copy;
  } else if (v instanceof Error) {
    copy = new (v.constructor as any)(v.message);
    copy.stack = v.stack;
  } else if (Array.isArray(v)) {
    copy = [];
    seen.set(value, copy);
    v.forEach((item, i) => (copy[i] = structuredClone(item, seen)));
    return copy;
  } else {
    copy = {};
    seen.set(value, copy);
    for (const key of Object.keys(v)) copy[key] = structuredClone(v[key], seen);
    return copy;
  }
  seen.set(value, copy);
  return copy;
}

// MARK: Install

const globals: Record<string, unknown> = {
  Event, CustomEvent, EventTarget, DOMException, AbortController, AbortSignal,
  TextEncoder, TextDecoder, atob, btoa,
  URL, URLSearchParams,
  fetch, Headers, Request, Response, Blob,
  WebSocket, MessageEvent, CloseEvent,
  crypto, localStorage, sessionStorage,
  structuredClone: (value: unknown) => structuredClone(value),
  navigator: {
    userAgent: __web.userAgent,
    language: __web.languages[0] ?? "en-US",
    languages: __web.languages,
    onLine: true,
    product: "SwiftJSX",
  },
  // Many packages read process.env.* (esbuild replaces NODE_ENV in app code).
  process: { env: { NODE_ENV: process.env.NODE_ENV }, browser: true, nextTick: (fn: (...args: unknown[]) => void, ...args: unknown[]) => queueMicrotask(() => fn(...args)) },
};
for (const name of Object.keys(globals)) {
  if (g[name] === undefined) g[name] = globals[name];
}

// `window` / `self` are the global object, and it's an event target: packages
// listen for "focus", "visibilitychange", "online" on it (the native app
// lifecycle fires them; see JSXRuntime). There's no `document`.
g.window = g.self = g.global = g;
const windowEvents = new EventTarget();
g.addEventListener = windowEvents.addEventListener.bind(windowEvents);
g.removeEventListener = windowEvents.removeEventListener.bind(windowEvents);
g.dispatchEvent = windowEvents.dispatchEvent.bind(windowEvents);

g.__swiftjsx_windowEvent = (type: string) => {
  if (type === "online" || type === "offline") g.navigator.onLine = type === "online";
  windowEvents.dispatchEvent(new Event(type));
};
