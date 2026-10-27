// URL and URLSearchParams. Foundation parses (WebHost.swift); this keeps the
// WHATWG shape: href/origin/host… getters and setters, live searchParams.

/// <reference path="./native.d.ts" />

const encode = (s: string) =>
  encodeURIComponent(s).replace(/%20/g, "+").replace(/[!'()~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
const decode = (s: string) => {
  try {
    return decodeURIComponent(s.replace(/\+/g, " "));
  } catch {
    return s;
  }
};

export class URLSearchParams {
  /** @internal */ _list: [string, string][] = [];
  /** @internal */ _url: URL | null = null;

  constructor(init: string | URLSearchParams | Record<string, string> | Iterable<[string, string]> = "") {
    if (typeof init === "string") this._parse(init);
    else if (init instanceof URLSearchParams) this._list = init._list.map(([k, v]) => [k, v]);
    else if (init && typeof (init as any)[Symbol.iterator] === "function") {
      for (const pair of init as Iterable<[string, string]>) {
        const [k, v] = [...pair];
        if (v === undefined) throw new TypeError("URLSearchParams: each pair needs a name and a value");
        this._list.push([String(k), String(v)]);
      }
    } else if (init && typeof init === "object") {
      for (const key of Object.keys(init)) this._list.push([key, String((init as Record<string, string>)[key])]);
    }
  }

  /** @internal */
  _parse(query: string) {
    this._list = [];
    for (const part of query.replace(/^\?/, "").split("&")) {
      if (!part) continue;
      const eq = part.indexOf("=");
      this._list.push(eq < 0 ? [decode(part), ""] : [decode(part.slice(0, eq)), decode(part.slice(eq + 1))]);
    }
  }

  private _changed() {
    if (this._url) this._url._setSearch(this.toString());
  }

  get size() {
    return this._list.length;
  }
  append(name: string, value: string) {
    this._list.push([String(name), String(value)]);
    this._changed();
  }
  delete(name: string, value?: string) {
    this._list = this._list.filter(([k, v]) => k !== name || (value !== undefined && v !== String(value)));
    this._changed();
  }
  get(name: string): string | null {
    return this._list.find(([k]) => k === name)?.[1] ?? null;
  }
  getAll(name: string): string[] {
    return this._list.filter(([k]) => k === name).map(([, v]) => v);
  }
  has(name: string, value?: string): boolean {
    return this._list.some(([k, v]) => k === name && (value === undefined || v === String(value)));
  }
  set(name: string, value: string) {
    const index = this._list.findIndex(([k]) => k === name);
    if (index < 0) this._list.push([String(name), String(value)]);
    else {
      this._list[index] = [String(name), String(value)];
      this._list = this._list.filter(([k], i) => k !== name || i === index);
    }
    this._changed();
  }
  sort() {
    this._list.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    this._changed();
  }
  forEach(callback: (value: string, name: string, params: URLSearchParams) => void, thisArg?: unknown) {
    for (const [k, v] of this._list) callback.call(thisArg, v, k, this);
  }
  *entries(): IterableIterator<[string, string]> {
    for (const [k, v] of this._list) yield [k, v];
  }
  *keys(): IterableIterator<string> {
    for (const [k] of this._list) yield k;
  }
  *values(): IterableIterator<string> {
    for (const [, v] of this._list) yield v;
  }
  [Symbol.iterator]() {
    return this.entries();
  }
  toString(): string {
    return this._list.map(([k, v]) => encode(k) + "=" + encode(v)).join("&");
  }
}

export class URL {
  private _parts!: URLParts;
  private _params = new URLSearchParams();

  constructor(url: string | URL, base?: string | URL) {
    const parts = __web.parseURL(String(url), base === undefined ? undefined : String(base));
    if (!parts) throw new TypeError(`Invalid URL: ${String(url)}`);
    this._parts = parts;
    this._params._parse(parts.search);
    this._params._url = this;
  }

  static canParse(url: string, base?: string): boolean {
    return __web.parseURL(String(url), base === undefined ? undefined : String(base)) !== null;
  }
  static parse(url: string, base?: string): URL | null {
    return URL.canParse(url, base) ? new URL(url, base) : null;
  }

  /** @internal */
  _setSearch(query: string) {
    this._parts.search = query ? "?" + query : "";
  }
  private _reparse(href: string) {
    const parts = __web.parseURL(href);
    if (!parts) throw new TypeError(`Invalid URL: ${href}`);
    this._parts = parts;
    this._params._parse(parts.search);
  }

  get href(): string {
    const p = this._parts;
    const auth = p.username ? p.username + (p.password ? ":" + p.password : "") + "@" : "";
    const authority = p.special || p.hostname ? "//" + auth + this.host : "";
    return p.protocol + authority + p.pathname + p.search + p.hash;
  }
  set href(value: string) {
    this._reparse(value);
  }
  get origin(): string {
    return this._parts.special && this._parts.protocol !== "file:" ? this.protocol + "//" + this.host : "null";
  }
  get protocol() {
    return this._parts.protocol;
  }
  set protocol(value: string) {
    this._reparse(value.replace(/:?$/, ":") + this.href.slice(this.protocol.length));
  }
  get username() {
    return this._parts.username;
  }
  set username(value: string) {
    this._parts.username = encodeURIComponent(value);
  }
  get password() {
    return this._parts.password;
  }
  set password(value: string) {
    this._parts.password = encodeURIComponent(value);
  }
  get host() {
    return this._parts.hostname + (this._parts.port ? ":" + this._parts.port : "");
  }
  set host(value: string) {
    const [hostname, port = ""] = value.split(":");
    this._parts.hostname = hostname.toLowerCase();
    this._parts.port = port;
  }
  get hostname() {
    return this._parts.hostname;
  }
  set hostname(value: string) {
    this._parts.hostname = value.toLowerCase();
  }
  get port() {
    return this._parts.port;
  }
  set port(value: string | number) {
    this._parts.port = String(value);
  }
  get pathname() {
    return this._parts.pathname;
  }
  set pathname(value: string) {
    this._reparse(this.protocol + (this._parts.special || this.hostname ? "//" + this.host : "") +
      (value.startsWith("/") ? "" : "/") + value + this.search + this.hash);
  }
  get search() {
    return this._parts.search === "?" ? "" : this._parts.search;
  }
  set search(value: string) {
    const query = String(value).replace(/^\?/, "");
    this._parts.search = query ? "?" + query : "";
    this._params._parse(query);
  }
  get searchParams(): URLSearchParams {
    return this._params;
  }
  get hash() {
    return this._parts.hash === "#" ? "" : this._parts.hash;
  }
  set hash(value: string) {
    const fragment = String(value).replace(/^#/, "");
    this._parts.hash = fragment ? "#" + fragment : "";
  }
  toString() {
    return this.href;
  }
  toJSON() {
    return this.href;
  }
}
