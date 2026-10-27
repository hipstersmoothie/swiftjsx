// WebSocket on URLSessionWebSocketTask (WebSockets.swift).

/// <reference path="./native.d.ts" />
import { DOMException, Event, EventTarget } from "./events";
import { Blob } from "./fetch";

export class MessageEvent<T = unknown> extends Event {
  readonly data: T;
  readonly origin: string;
  constructor(type: string, init: { data?: T; origin?: string } = {}) {
    super(type);
    this.data = init.data as T;
    this.origin = init.origin ?? "";
  }
}

export class CloseEvent extends Event {
  readonly code: number;
  readonly reason: string;
  readonly wasClean: boolean;
  constructor(type: string, init: { code?: number; reason?: string; wasClean?: boolean } = {}) {
    super(type);
    this.code = init.code ?? 0;
    this.reason = init.reason ?? "";
    this.wasClean = !!init.wasClean;
  }
}

let nextSocket = 1;
const sockets = new Map<number, WebSocket>();

export class WebSocket extends EventTarget {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  readonly url: string;
  readyState = 0;
  protocol = "";
  extensions = "";
  bufferedAmount = 0;
  binaryType: "blob" | "arraybuffer" = "blob";
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  /** @internal */ readonly _id = nextSocket++;

  constructor(url: string | { href: string }, protocols: string | string[] = []) {
    super();
    const parsed = new (globalThis as any).URL(String(url));
    if (parsed.protocol === "http:") parsed.protocol = "ws:";
    if (parsed.protocol === "https:") parsed.protocol = "wss:";
    if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
      throw new DOMException(`WebSocket: "${url}" isn't a ws: or wss: URL`, "SyntaxError");
    }
    this.url = parsed.href;
    sockets.set(this._id, this);
    __web.wsOpen(this._id, this.url, typeof protocols === "string" ? [protocols] : protocols);
  }

  send(data: string | ArrayBuffer | ArrayBufferView | Blob) {
    if (this.readyState === WebSocket.CONNECTING) throw new DOMException("WebSocket is still connecting", "InvalidStateError");
    if (this.readyState !== WebSocket.OPEN) return;
    if (typeof data === "string") __web.wsSend(this._id, data);
    else if (data instanceof Blob) __web.wsSend(this._id, data._bytes);
    else __web.wsSend(this._id, data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
  }

  close(code = 1000, reason = "") {
    if (this.readyState >= WebSocket.CLOSING) return;
    this.readyState = WebSocket.CLOSING;
    __web.wsClose(this._id, code, reason);
  }
}

(globalThis as any).__swiftjsx_wsEvent = (id: number, type: string, payload: any) => {
  const socket = sockets.get(id);
  if (!socket) return;
  switch (type) {
    case "open":
      socket.readyState = WebSocket.OPEN;
      socket.protocol = payload;
      socket.dispatchEvent(new Event("open"));
      break;
    case "message": {
      const data = typeof payload === "string" || socket.binaryType === "arraybuffer" ? payload : new Blob([payload]);
      socket.dispatchEvent(new MessageEvent("message", { data, origin: new (globalThis as any).URL(socket.url).origin }));
      break;
    }
    case "error":
      socket.dispatchEvent(new Event("error"));
      break;
    case "close":
      socket.readyState = WebSocket.CLOSED;
      sockets.delete(id);
      socket.dispatchEvent(new CloseEvent("close", payload));
      break;
  }
};
