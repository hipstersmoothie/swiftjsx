// XMLHttpRequest on fetch, for libraries that still use it (axios's upload
// progress, older SDKs). Asynchronous only; upload progress comes from
// URLSession, download progress from the streamed body.

/// <reference path="./native.d.ts" />

import { Event, EventTarget, DOMException } from "./events";
import { fetch, Headers, Blob } from "./fetch";

type Handler = ((event: ProgressEvent) => void) | null;

export class ProgressEvent extends Event {
  readonly lengthComputable: boolean;
  readonly loaded: number;
  readonly total: number;
  constructor(type: string, init: { lengthComputable?: boolean; loaded?: number; total?: number } = {}) {
    super(type);
    this.lengthComputable = !!init.lengthComputable;
    this.loaded = init.loaded ?? 0;
    this.total = init.total ?? 0;
  }
}

export class XMLHttpRequestEventTarget extends EventTarget {
  onloadstart: Handler = null;
  onprogress: Handler = null;
  onabort: Handler = null;
  onerror: Handler = null;
  onload: Handler = null;
  ontimeout: Handler = null;
  onloadend: Handler = null;
}

type ResponseType = "" | "text" | "json" | "arraybuffer" | "blob";

export class XMLHttpRequest extends XMLHttpRequestEventTarget {
  static readonly UNSENT = 0;
  static readonly OPENED = 1;
  static readonly HEADERS_RECEIVED = 2;
  static readonly LOADING = 3;
  static readonly DONE = 4;
  readonly UNSENT = 0;
  readonly OPENED = 1;
  readonly HEADERS_RECEIVED = 2;
  readonly LOADING = 3;
  readonly DONE = 4;

  readyState = 0;
  status = 0;
  statusText = "";
  responseURL = "";
  responseType: ResponseType = "";
  /** Milliseconds; 0 waits forever. */
  timeout = 0;
  withCredentials = false;
  readonly upload = new XMLHttpRequestEventTarget();
  onreadystatechange: ((event: Event) => void) | null = null;

  private method = "GET";
  private url = "";
  private requestHeaders = new Headers();
  private responseHeaders: Headers | null = null;
  private mimeOverride: string | null = null;
  private chunks: Uint8Array[] = [];
  private bytes: Uint8Array | null = null;
  private controller: AbortController | null = null;
  private sent = false;

  open(method: string, url: string | { href: string }, async = true) {
    if (!async) throw new DOMException("Synchronous XMLHttpRequest isn't supported", "InvalidAccessError");
    this.controller?.abort();
    this.method = String(method).toUpperCase();
    this.url = String(url);
    this.requestHeaders = new Headers();
    this.responseHeaders = null;
    this.chunks = [];
    this.bytes = null;
    this.status = 0;
    this.statusText = "";
    this.responseURL = "";
    this.sent = false;
    this.setState(XMLHttpRequest.OPENED);
  }

  setRequestHeader(name: string, value: string) {
    if (this.readyState !== XMLHttpRequest.OPENED || this.sent) throw new DOMException("The object's state must be OPENED.", "InvalidStateError");
    this.requestHeaders.append(name, value);
  }

  overrideMimeType(mime: string) {
    this.mimeOverride = mime;
  }

  send(body: any = null) {
    if (this.readyState !== XMLHttpRequest.OPENED || this.sent) throw new DOMException("The object's state must be OPENED.", "InvalidStateError");
    this.sent = true;
    const controller = (this.controller = new AbortController());
    const hasBody = body !== null && body !== undefined && this.method !== "GET" && this.method !== "HEAD";
    this.fire(this, "loadstart");
    if (hasBody) this.fire(this.upload, "loadstart");
    const timer = this.timeout > 0 ? setTimeout(() => this.end("timeout"), this.timeout) : undefined;

    fetch(this.url, {
      method: this.method,
      headers: this.requestHeaders,
      body: hasBody ? body : null,
      signal: controller.signal,
      onUploadProgress: hasBody ? ({ loaded, total }) => this.fire(this.upload, "progress", loaded, total) : undefined,
    })
      .then(async (response) => {
        if (this.controller !== controller) return;
        this.status = response.status;
        this.statusText = response.statusText;
        this.responseURL = response.url;
        this.responseHeaders = response.headers;
        if (hasBody) {
          this.fire(this.upload, "load");
          this.fire(this.upload, "loadend");
        }
        this.setState(XMLHttpRequest.HEADERS_RECEIVED);
        const total = Number(response.headers.get("content-length")) || 0;
        let loaded = 0;
        if (response.body) {
          for await (const chunk of response.body) {
            if (this.controller !== controller) return;
            this.chunks.push(chunk);
            loaded += chunk.length;
            if (this.readyState !== XMLHttpRequest.LOADING) this.setState(XMLHttpRequest.LOADING);
            else this.setState(XMLHttpRequest.LOADING, true);
            this.fire(this, "progress", loaded, total);
          }
        }
        if (this.controller !== controller) return;
        clearTimeout(timer);
        this.controller = null;
        this.setState(XMLHttpRequest.DONE);
        this.fire(this, "load", loaded, total);
        this.fire(this, "loadend", loaded, total);
      })
      .catch(() => {
        clearTimeout(timer);
        if (this.controller !== controller) return;
        // A network error (aborts and timeouts are reported by end()).
        this.controller = null;
        this.status = 0;
        this.setState(XMLHttpRequest.DONE);
        if (hasBody) {
          this.fire(this.upload, "error");
          this.fire(this.upload, "loadend");
        }
        this.fire(this, "error");
        this.fire(this, "loadend");
      });
  }

  abort() {
    this.end("abort");
  }

  private end(how: "abort" | "timeout") {
    const controller = this.controller;
    if (!controller) {
      if (how === "abort" && this.readyState === XMLHttpRequest.DONE) this.readyState = XMLHttpRequest.UNSENT;
      return;
    }
    this.controller = null;
    controller.abort();
    this.status = 0;
    this.chunks = [];
    this.setState(XMLHttpRequest.DONE);
    this.fire(this, how);
    this.fire(this, "loadend");
    if (how === "abort") this.readyState = XMLHttpRequest.UNSENT;
  }

  getResponseHeader(name: string): string | null {
    return this.responseHeaders?.get(name) ?? null;
  }

  getAllResponseHeaders(): string {
    if (!this.responseHeaders) return "";
    let out = "";
    for (const [name, value] of this.responseHeaders.entries()) out += `${name}: ${value}\r\n`;
    return out;
  }

  get responseText(): string {
    if (this.responseType !== "" && this.responseType !== "text") {
      throw new DOMException(`responseText is only available if responseType is '' or 'text' (was '${this.responseType}')`, "InvalidStateError");
    }
    return this.text();
  }

  private text(): string {
    return __web.decodeUTF8(this.data(), false) as string;
  }

  get response(): any {
    switch (this.responseType) {
      case "":
      case "text":
        return this.responseText;
      case "json":
        if (this.readyState !== XMLHttpRequest.DONE) return null;
        try {
          return JSON.parse(this.text().replace(/^\ufeff/, ""));
        } catch {
          return null;
        }
      case "arraybuffer":
        return this.readyState === XMLHttpRequest.DONE ? this.data().slice().buffer : null;
      case "blob":
        return this.readyState === XMLHttpRequest.DONE
          ? new Blob([this.data()], { type: this.mimeOverride ?? this.getResponseHeader("content-type") ?? "" })
          : null;
    }
  }

  /** The body so far, joined. */
  private data(): Uint8Array {
    if (this.bytes && !this.chunks.length) return this.bytes;
    const previous = this.bytes ?? new Uint8Array(0);
    const joined = new Uint8Array(previous.length + this.chunks.reduce((n, c) => n + c.length, 0));
    joined.set(previous);
    let offset = previous.length;
    for (const chunk of this.chunks) {
      joined.set(chunk, offset);
      offset += chunk.length;
    }
    this.chunks = [];
    this.bytes = joined;
    return joined;
  }

  private setState(state: number, repeat = false) {
    if (this.readyState === state && !repeat) return;
    this.readyState = state;
    this.dispatchEvent(new Event("readystatechange"));
  }

  private fire(target: EventTarget, type: string, loaded = 0, total = 0) {
    target.dispatchEvent(new ProgressEvent(type, { lengthComputable: total > 0, loaded, total }));
  }
}
