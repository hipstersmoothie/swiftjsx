// Event, CustomEvent, EventTarget, DOMException, AbortController, AbortSignal.

export class DOMException extends Error {
  constructor(message = "", name = "Error") {
    super(message);
    this.name = name;
  }
}

type EventInit = { bubbles?: boolean; cancelable?: boolean; composed?: boolean };

export class Event {
  readonly type: string;
  readonly bubbles: boolean;
  readonly cancelable: boolean;
  readonly composed: boolean;
  readonly timeStamp = performance.now();
  defaultPrevented = false;
  target: EventTarget | null = null;
  currentTarget: EventTarget | null = null;
  /** @internal */ _stopped = false;

  constructor(type: string, init: EventInit = {}) {
    if (arguments.length === 0) throw new TypeError("Event constructor: 1 argument required");
    this.type = String(type);
    this.bubbles = !!init.bubbles;
    this.cancelable = !!init.cancelable;
    this.composed = !!init.composed;
  }
  preventDefault() {
    if (this.cancelable) this.defaultPrevented = true;
  }
  stopPropagation() {}
  stopImmediatePropagation() {
    this._stopped = true;
  }
}

export class CustomEvent<T = unknown> extends Event {
  readonly detail: T;
  constructor(type: string, init: EventInit & { detail?: T } = {}) {
    super(type, init);
    this.detail = init.detail as T;
  }
}

type Listener = ((event: Event) => void) | { handleEvent(event: Event): void };
type ListenerOptions = boolean | { once?: boolean; capture?: boolean; signal?: AbortSignal };
type Entry = { listener: Listener; once: boolean; capture: boolean };

const listeners = Symbol("listeners");

export class EventTarget {
  [listeners] = new Map<string, Entry[]>();

  addEventListener(type: string, listener: Listener | null, options?: ListenerOptions) {
    if (!listener) return;
    const opts = typeof options === "boolean" ? { capture: options } : options ?? {};
    if (opts.signal?.aborted) return;
    const capture = !!opts.capture;
    const list = this[listeners].get(type) ?? [];
    if (list.some((e) => e.listener === listener && e.capture === capture)) return;
    list.push({ listener, once: !!opts.once, capture });
    this[listeners].set(type, list);
    opts.signal?.addEventListener("abort", () => this.removeEventListener(type, listener, { capture }));
  }

  removeEventListener(type: string, listener: Listener | null, options?: boolean | { capture?: boolean }) {
    const capture = typeof options === "boolean" ? options : !!options?.capture;
    const list = this[listeners].get(type);
    if (!list) return;
    const index = list.findIndex((e) => e.listener === listener && e.capture === capture);
    if (index >= 0) list.splice(index, 1);
  }

  dispatchEvent(event: Event): boolean {
    event.target ??= this;
    event.currentTarget = this;
    for (const entry of [...(this[listeners].get(event.type) ?? [])]) {
      if (entry.once) this.removeEventListener(event.type, entry.listener, { capture: entry.capture });
      try {
        if (typeof entry.listener === "function") entry.listener.call(this, event);
        else entry.listener.handleEvent(event);
      } catch (error) {
        reportError(error);
      }
      if (event._stopped) break;
    }
    const handler = (this as any)["on" + event.type];
    if (typeof handler === "function") handler.call(this, event);
    event.currentTarget = null;
    return !event.defaultPrevented;
  }
}

function reportError(error: unknown) {
  console.error(error instanceof Error ? `${error.message}\n${error.stack}` : String(error));
}

export class AbortSignal extends EventTarget {
  aborted = false;
  reason: unknown = undefined;
  onabort: ((event: Event) => void) | null = null;

  throwIfAborted() {
    if (this.aborted) throw this.reason;
  }

  /** @internal */
  _abort(reason: unknown) {
    if (this.aborted) return;
    this.aborted = true;
    this.reason = reason === undefined ? new DOMException("This operation was aborted", "AbortError") : reason;
    this.dispatchEvent(new Event("abort"));
  }

  static abort(reason?: unknown): AbortSignal {
    const signal = new AbortSignal();
    signal._abort(reason);
    return signal;
  }

  static timeout(ms: number): AbortSignal {
    const signal = new AbortSignal();
    setTimeout(() => signal._abort(new DOMException("The operation timed out.", "TimeoutError")), ms);
    return signal;
  }

  static any(signals: Iterable<AbortSignal>): AbortSignal {
    const signal = new AbortSignal();
    for (const s of signals) {
      if (s.aborted) {
        signal._abort(s.reason);
        break;
      }
      s.addEventListener("abort", () => signal._abort(s.reason), { once: true });
    }
    return signal;
  }
}

export class AbortController {
  readonly signal = new AbortSignal();
  abort(reason?: unknown) {
    this.signal._abort(reason);
  }
}
