// fetch, Headers, Request, Response, Blob, File, FormData. Requests run on
// URLSession (WebHost.swift), off the JS thread. Responses stream: fetch
// resolves when the headers arrive, and `response.body` is a ReadableStream of
// the chunks as they come (text() / json() wait for all of them).

/// <reference path="./native.d.ts" />
import { AbortSignal, DOMException } from "./events";
import { URLSearchParams } from "./url";
import { ReadableStream, readAll, type ReadableStreamDefaultController } from "./streams";

type HeadersInit = Headers | Record<string, string> | Iterable<[string, string]>;

export class Headers {
  private _map = new Map<string, string>();

  constructor(init?: HeadersInit) {
    if (init instanceof Headers) init.forEach((v, k) => this.append(k, v));
    else if (init && typeof (init as any)[Symbol.iterator] === "function") {
      for (const [k, v] of init as Iterable<[string, string]>) this.append(k, v);
    } else if (init) for (const k of Object.keys(init)) this.append(k, (init as Record<string, string>)[k]);
  }
  append(name: string, value: string) {
    const key = name.toLowerCase();
    const existing = this._map.get(key);
    this._map.set(key, existing === undefined ? String(value).trim() : `${existing}, ${String(value).trim()}`);
  }
  set(name: string, value: string) {
    this._map.set(name.toLowerCase(), String(value).trim());
  }
  get(name: string): string | null {
    return this._map.get(name.toLowerCase()) ?? null;
  }
  getSetCookie(): string[] {
    return this.get("set-cookie")?.split(/,\s*(?=[^;,]+=)/) ?? [];
  }
  has(name: string) {
    return this._map.has(name.toLowerCase());
  }
  delete(name: string) {
    this._map.delete(name.toLowerCase());
  }
  forEach(callback: (value: string, name: string, headers: Headers) => void, thisArg?: unknown) {
    for (const [k, v] of this.entries()) callback.call(thisArg, v, k, this);
  }
  *entries(): IterableIterator<[string, string]> {
    yield* [...this._map.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
  }
  *keys() {
    for (const [k] of this.entries()) yield k;
  }
  *values() {
    for (const [, v] of this.entries()) yield v;
  }
  [Symbol.iterator]() {
    return this.entries();
  }
}

type BlobPart = string | ArrayBuffer | ArrayBufferView | Blob;

export class Blob {
  /** @internal */ _bytes: Uint8Array;
  readonly type: string;

  constructor(parts: BlobPart[] = [], options: { type?: string } = {}) {
    const chunks = parts.map(toBytes);
    this._bytes = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      this._bytes.set(chunk, offset);
      offset += chunk.length;
    }
    this.type = (options.type ?? "").toLowerCase();
  }
  get size() {
    return this._bytes.length;
  }
  async text() {
    return __web.decodeUTF8(this._bytes, false) as string;
  }
  async arrayBuffer() {
    return this._bytes.slice().buffer;
  }
  async bytes() {
    return this._bytes.slice();
  }
  slice(start?: number, end?: number, type?: string) {
    return new Blob([this._bytes.slice(start, end)], { type });
  }
}

export class File extends Blob {
  readonly name: string;
  readonly lastModified: number;
  constructor(parts: BlobPart[], name: string, options: { type?: string; lastModified?: number } = {}) {
    super(parts, options);
    this.name = String(name);
    this.lastModified = options.lastModified ?? Date.now();
  }
}

type FormDataValue = string | File;

/** Form fields and files, sent as multipart/form-data. */
export class FormData {
  private _entries: [string, FormDataValue][] = [];

  append(name: string, value: string | Blob, filename?: string) {
    this._entries.push([String(name), normalize(value, filename)]);
  }
  set(name: string, value: string | Blob, filename?: string) {
    const key = String(name);
    const index = this._entries.findIndex(([k]) => k === key);
    this._entries = this._entries.filter(([k], i) => k !== key || i === index);
    if (index === -1) this._entries.push([key, normalize(value, filename)]);
    else this._entries[this._entries.findIndex(([k]) => k === key)] = [key, normalize(value, filename)];
  }
  get(name: string): FormDataValue | null {
    return this._entries.find(([k]) => k === name)?.[1] ?? null;
  }
  getAll(name: string): FormDataValue[] {
    return this._entries.filter(([k]) => k === name).map(([, v]) => v);
  }
  has(name: string) {
    return this._entries.some(([k]) => k === name);
  }
  delete(name: string) {
    this._entries = this._entries.filter(([k]) => k !== name);
  }
  forEach(callback: (value: FormDataValue, name: string, form: FormData) => void) {
    for (const [k, v] of this._entries) callback(v, k, this);
  }
  *entries(): IterableIterator<[string, FormDataValue]> {
    yield* this._entries;
  }
  *keys() {
    for (const [k] of this._entries) yield k;
  }
  *values() {
    for (const [, v] of this._entries) yield v;
  }
  [Symbol.iterator]() {
    return this.entries();
  }

  /** @internal The multipart/form-data body and its boundary. */
  _encode(): { bytes: Uint8Array; boundary: string } {
    const boundary = `----swiftjsx${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
    const escape = (s: string) => s.replace(/"/g, "%22").replace(/\r?\n/g, "%0A");
    const parts: BlobPart[] = [];
    for (const [name, value] of this._entries) {
      parts.push(`--${boundary}\r\n`);
      if (typeof value === "string") {
        parts.push(`Content-Disposition: form-data; name="${escape(name)}"\r\n\r\n${value}\r\n`);
      } else {
        parts.push(
          `Content-Disposition: form-data; name="${escape(name)}"; filename="${escape(value.name)}"\r\n` +
            `Content-Type: ${value.type || "application/octet-stream"}\r\n\r\n`,
          value,
          "\r\n",
        );
      }
    }
    parts.push(`--${boundary}--\r\n`);
    return { bytes: new Blob(parts)._bytes, boundary };
  }
}

function normalize(value: string | Blob, filename?: string): FormDataValue {
  if (value instanceof File && filename === undefined) return value;
  if (value instanceof Blob) return new File([value], filename ?? (value instanceof File ? value.name : "blob"), { type: value.type });
  return String(value);
}

function toBytes(part: BlobPart): Uint8Array {
  if (typeof part === "string") return __web.encodeUTF8(part);
  if (part instanceof Blob) return part._bytes;
  if (part instanceof ArrayBuffer) return new Uint8Array(part);
  return new Uint8Array(part.buffer, part.byteOffset, part.byteLength);
}

type BodyInit = string | ArrayBuffer | ArrayBufferView | Blob | URLSearchParams | FormData | null;

/** Normalizes a body to a string or bytes, and the content type it implies. */
function extractBody(body: BodyInit | undefined): { data: string | Uint8Array | null; type: string | null } {
  if (body == null) return { data: null, type: null };
  if (typeof body === "string") return { data: body, type: "text/plain;charset=UTF-8" };
  if (body instanceof URLSearchParams) return { data: body.toString(), type: "application/x-www-form-urlencoded;charset=UTF-8" };
  if (body instanceof Blob) return { data: body._bytes, type: body.type || null };
  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) return { data: toBytes(body), type: null };
  if (body instanceof FormData) {
    const { bytes, boundary } = body._encode();
    return { data: bytes, type: `multipart/form-data; boundary=${boundary}` };
  }
  return { data: String(body), type: "text/plain;charset=UTF-8" };
}

abstract class Body {
  /** @internal */ _data: string | Uint8Array | null = null;
  /** @internal A streamed body (fetch responses), instead of `_data`. */
  _stream: ReadableStream<Uint8Array> | null = null;
  bodyUsed = false;
  abstract headers: Headers;

  /** The body as a stream of byte chunks (null when there's no body). */
  get body(): ReadableStream<Uint8Array> | null {
    if (this._stream) return this._stream;
    if (this._data === null) return null;
    const data = this._data;
    this._data = null;
    this._stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(typeof data === "string" ? __web.encodeUTF8(data) : data);
        controller.close();
      },
    });
    return this._stream;
  }
  private async _consume(): Promise<string | Uint8Array | null> {
    if (this.bodyUsed || this._stream?.locked) throw new TypeError("Body has already been consumed.");
    this.bodyUsed = true;
    return this._stream ? readAll(this._stream) : this._data;
  }
  async text(): Promise<string> {
    const data = await this._consume();
    return data === null ? "" : typeof data === "string" ? data : (__web.decodeUTF8(data, false) as string);
  }
  async json(): Promise<any> {
    return JSON.parse(await this.text());
  }
  async bytes(): Promise<Uint8Array> {
    const data = await this._consume();
    return data === null ? new Uint8Array() : typeof data === "string" ? __web.encodeUTF8(data) : data.slice();
  }
  async arrayBuffer(): Promise<ArrayBuffer> {
    return (await this.bytes()).buffer as ArrayBuffer;
  }
  async blob(): Promise<Blob> {
    return new Blob([await this.bytes()], { type: this.headers.get("content-type") ?? "" });
  }
  /** URL-encoded bodies (multipart responses aren't parsed). */
  async formData(): Promise<FormData> {
    const type = this.headers.get("content-type") ?? "";
    if (!type.includes("application/x-www-form-urlencoded")) throw new TypeError(`formData(): can't parse "${type}"`);
    const form = new FormData();
    new URLSearchParams(await this.text()).forEach((value, key) => form.append(key, value));
    return form;
  }
}

type RequestInit = {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit;
  signal?: AbortSignal | null;
  [key: string]: unknown; // mode, credentials, cache, redirect…: accepted, not used
};

export class Request extends Body {
  readonly url: string;
  readonly method: string;
  readonly headers: Headers;
  readonly signal: AbortSignal;

  constructor(input: string | { href: string } | Request, init: RequestInit = {}) {
    super();
    const source = input instanceof Request ? input : null;
    let url = source ? source.url : String(input);
    try {
      url = new (globalThis as any).URL(url).href;
    } catch {
      throw new TypeError(`fetch: "${url}" isn't an absolute URL (there's no page to resolve it against)`);
    }
    this.url = url;
    this.method = (init.method ?? source?.method ?? "GET").toUpperCase();
    this.headers = new Headers(init.headers ?? source?.headers);
    this.signal = init.signal ?? source?.signal ?? new AbortSignal();
    const { data, type } = extractBody(init.body !== undefined ? init.body : source?._data ?? null);
    if (data !== null && (this.method === "GET" || this.method === "HEAD")) {
      throw new TypeError("Request with GET/HEAD method cannot have body.");
    }
    this._data = data;
    if (type && !this.headers.has("content-type")) this.headers.set("content-type", type);
  }
  clone(): Request {
    return new Request(this);
  }
}

type ResponseInit = { status?: number; statusText?: string; headers?: HeadersInit };

export class Response extends Body {
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly type: string = "basic";
  url = "";
  redirected = false;

  constructor(body: BodyInit = null, init: ResponseInit = {}) {
    super();
    this.status = init.status ?? 200;
    if (this.status < 200 || this.status > 599) throw new RangeError(`Invalid status ${this.status}`);
    this.statusText = init.statusText ?? "";
    this.headers = new Headers(init.headers);
    const { data, type } = extractBody(body);
    this._data = data;
    if (type && !this.headers.has("content-type")) this.headers.set("content-type", type);
  }
  get ok() {
    return this.status >= 200 && this.status < 300;
  }
  clone(): Response {
    if (this.bodyUsed) throw new TypeError("Response.clone: Body has already been consumed.");
    const copy = new Response(null, { status: this.status, statusText: this.statusText, headers: this.headers });
    copy._data = this._data;
    if (this._stream) [this._stream, copy._stream] = this._stream.tee();
    copy.url = this.url;
    copy.redirected = this.redirected;
    return copy;
  }
  static json(data: unknown, init: ResponseInit = {}) {
    const headers = new Headers(init.headers);
    if (!headers.has("content-type")) headers.set("content-type", "application/json");
    return new Response(JSON.stringify(data), { ...init, headers });
  }
  static error() {
    const response = new Response(null, { status: 200 });
    (response as any).type = "error";
    return response;
  }
  static redirect(url: string, status = 302) {
    return new Response(null, { status, headers: { location: String(url) } });
  }
}

let nextFetch = 1;
type Pending = {
  resolve: (r: Response) => void;
  reject: (e: unknown) => void;
  signal: AbortSignal;
  /** Set once the headers arrived: the body stream's controller. */
  body?: ReadableStreamDefaultController<Uint8Array>;
};
const pending = new Map<number, Pending>();

export function fetch(input: string | { href: string } | Request, init?: RequestInit): Promise<Response> {
  return new Promise((resolve, reject) => {
    const request = new Request(input, init);
    const { signal } = request;
    if (signal.aborted) return reject(signal.reason);
    const id = nextFetch++;
    pending.set(id, { resolve, reject, signal });
    signal.addEventListener("abort", () => __web.abort(id), { once: true });
    const body = request._data;
    __web.fetch(id, {
      method: request.method,
      url: request.url,
      headers: [...request.headers.entries()],
      ...(body === null ? {} : { body }),
    });
  });
}

// Called by Swift: the response's headers (fetch resolves here), each chunk
// of its body, then the end (or an error).
(globalThis as any).__swiftjsx_fetchHead = (
  id: number,
  info: { status: number; statusText: string; url: string; redirected: boolean; headers: [string, string][] },
) => {
  const request = pending.get(id);
  if (!request) return;
  const response = new Response(null, { status: info.status, statusText: info.statusText, headers: info.headers });
  response._stream = new ReadableStream<Uint8Array>({
    start: (controller) => void (request.body = controller),
    cancel: () => __web.abort(id),
  });
  response.url = info.url;
  response.redirected = info.redirected;
  request.resolve(response);
};

(globalThis as any).__swiftjsx_fetchChunk = (id: number, chunk: ArrayBuffer) => {
  pending.get(id)?.body?.enqueue(new Uint8Array(chunk));
};

(globalThis as any).__swiftjsx_fetchDone = (id: number, error: { name: string; message: string } | null) => {
  const request = pending.get(id);
  if (!request) return;
  pending.delete(id);
  if (!error) return request.body?.close();
  const reason = error.name === "AbortError" ? request.signal.reason ?? new DOMException(error.message, "AbortError") : new TypeError(error.message);
  // Before the headers: fetch rejects; after: reading the body does.
  if (request.body) request.body.error(reason);
  else request.reject(reason);
};
