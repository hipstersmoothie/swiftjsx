// TextEncoder / TextDecoder (UTF-8, native) and atob / btoa.

/// <reference path="./native.d.ts" />

export class TextEncoder {
  readonly encoding = "utf-8";
  encode(input = ""): Uint8Array {
    return __web.encodeUTF8(String(input));
  }
  encodeInto(input: string, destination: Uint8Array): { read: number; written: number } {
    const bytes = this.encode(input);
    if (bytes.length <= destination.length) {
      destination.set(bytes);
      return { read: input.length, written: bytes.length };
    }
    // Only whole characters fit.
    let read = 0;
    let written = 0;
    for (const char of input) {
      const size = this.encode(char).length;
      if (written + size > destination.length) break;
      destination.set(this.encode(char), written);
      written += size;
      read += char.length;
    }
    return { read, written };
  }
}

export class TextDecoder {
  readonly encoding = "utf-8";
  readonly fatal: boolean;
  readonly ignoreBOM: boolean;

  constructor(label = "utf-8", options: { fatal?: boolean; ignoreBOM?: boolean } = {}) {
    const name = String(label).trim().toLowerCase();
    if (name !== "utf-8" && name !== "utf8" && name !== "unicode-1-1-utf-8") {
      throw new RangeError(`TextDecoder: only UTF-8 is supported, not "${label}"`);
    }
    this.fatal = !!options.fatal;
    this.ignoreBOM = !!options.ignoreBOM;
  }

  decode(input?: ArrayBuffer | ArrayBufferView, _options?: { stream?: boolean }): string {
    if (input === undefined) return "";
    const bytes = input instanceof DataView ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength) : input;
    const text = __web.decodeUTF8(bytes, this.fatal);
    if (text === null) throw new TypeError("TextDecoder: the encoded data was not valid UTF-8");
    return !this.ignoreBOM && text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  }
}

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export function btoa(data: string): string {
  const s = String(data);
  let out = "";
  for (let i = 0; i < s.length; i += 3) {
    const a = s.charCodeAt(i), b = s.charCodeAt(i + 1), c = s.charCodeAt(i + 2);
    if (a > 255 || b > 255 || c > 255) throw new DOMExceptionLike("The string contains characters outside of the Latin1 range.", "InvalidCharacterError");
    const n = (a << 16) | ((b || 0) << 8) | (c || 0);
    out += alphabet[(n >> 18) & 63] + alphabet[(n >> 12) & 63] +
      (i + 1 < s.length ? alphabet[(n >> 6) & 63] : "=") + (i + 2 < s.length ? alphabet[n & 63] : "=");
  }
  return out;
}

export function atob(data: string): string {
  let s = String(data).replace(/[\t\n\f\r ]/g, "");
  if (s.length % 4 === 0) s = s.replace(/==?$/, "");
  if (s.length % 4 === 1 || /[^A-Za-z0-9+/]/.test(s)) {
    throw new DOMExceptionLike("The string to be decoded is not correctly encoded.", "InvalidCharacterError");
  }
  let out = "";
  let buffer = 0, bits = 0;
  for (const char of s) {
    buffer = (buffer << 6) | alphabet.indexOf(char);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out += String.fromCharCode((buffer >> bits) & 255);
    }
  }
  return out;
}

class DOMExceptionLike extends Error {
  constructor(message: string, name: string) {
    super(message);
    this.name = name;
  }
}
