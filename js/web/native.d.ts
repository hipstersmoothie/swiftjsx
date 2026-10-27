// Provided by Swift (Sources/SwiftJSX/WebHost.swift).
declare const __web: {
  fetch(id: number, request: { method: string; url: string; headers: [string, string][]; body?: string | Uint8Array }): void;
  abort(id: number): void;
  wsOpen(id: number, url: string, protocols: string[]): void;
  wsSend(id: number, data: string | Uint8Array): void;
  wsClose(id: number, code: number, reason: string): void;
  encodeUTF8(text: string): Uint8Array;
  /** null when `fatal` and the bytes aren't valid UTF-8. */
  decodeUTF8(bytes: ArrayBuffer | ArrayBufferView, fatal: boolean): string | null;
  randomFill(array: ArrayBufferView): void;
  randomUUID(): string;
  storage(op: "get" | "set" | "remove" | "clear" | "keys", key?: string, value?: string): any;
  parseURL(input: string, base?: string): URLParts | null;
  userAgent: string;
  languages: string[];
};

type URLParts = {
  protocol: string; username: string; password: string; hostname: string; port: string;
  pathname: string; search: string; hash: string; special: string;
};
