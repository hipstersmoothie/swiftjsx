// Types for the web APIs SwiftJSX installs as globals (js/web/index.ts), for
// app code. Not the DOM: there's no `document`.

import type * as Events from "./events";
import type * as Encoding from "./encoding";
import type * as Urls from "./url";
import type * as Fetch from "./fetch";

type WebStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
  key(index: number): string | null;
  readonly length: number;
};

declare global {
  // @types/react declares empty Event / EventTarget / Blob interfaces for
  // projects without DOM types; these merge into them.
  var Event: typeof Events.Event;
  interface Event extends Events.Event {}
  var CustomEvent: typeof Events.CustomEvent;
  type CustomEvent<T = unknown> = Events.CustomEvent<T>;
  var EventTarget: typeof Events.EventTarget;
  interface EventTarget extends Events.EventTarget {}
  var DOMException: typeof Events.DOMException;
  type DOMException = Events.DOMException;
  var AbortController: typeof Events.AbortController;
  type AbortController = Events.AbortController;
  var AbortSignal: typeof Events.AbortSignal;
  type AbortSignal = Events.AbortSignal;

  var TextEncoder: typeof Encoding.TextEncoder;
  type TextEncoder = Encoding.TextEncoder;
  var TextDecoder: typeof Encoding.TextDecoder;
  type TextDecoder = Encoding.TextDecoder;
  function atob(data: string): string;
  function btoa(data: string): string;

  var URL: typeof Urls.URL;
  type URL = Urls.URL;
  var URLSearchParams: typeof Urls.URLSearchParams;
  type URLSearchParams = Urls.URLSearchParams;

  var fetch: typeof Fetch.fetch;
  var Headers: typeof Fetch.Headers;
  type Headers = Fetch.Headers;
  var Request: typeof Fetch.Request;
  type Request = Fetch.Request;
  var Response: typeof Fetch.Response;
  type Response = Fetch.Response;
  var Blob: typeof Fetch.Blob;
  interface Blob extends Fetch.Blob {}

  var crypto: {
    getRandomValues<T extends ArrayBufferView>(array: T): T;
    randomUUID(): `${string}-${string}-${string}-${string}-${string}`;
  };
  var localStorage: WebStorage;
  var sessionStorage: WebStorage;
  function structuredClone<T>(value: T): T;
  /** The global object (there's no DOM). */
  var window: typeof globalThis;
  var self: typeof globalThis;
  var navigator: { userAgent: string; language: string; languages: string[]; onLine: boolean; product: string };
  function addEventListener(type: "focus" | "blur" | "visibilitychange" | "online" | "offline" | (string & {}), listener: (event: Event) => void): void;
  function removeEventListener(type: string, listener: (event: Event) => void): void;
}

export {};
