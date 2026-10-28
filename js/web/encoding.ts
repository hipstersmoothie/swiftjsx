// TextEncoder (UTF-8, native), TextDecoder (UTF-8 natively; UTF-16 and
// windows-1252 in JS) and atob / btoa.

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

type Encoding = "utf-8" | "utf-16le" | "utf-16be" | "windows-1252";

const labels: Record<string, Encoding> = {
  "utf-8": "utf-8", utf8: "utf-8", "unicode-1-1-utf-8": "utf-8", "unicode11utf8": "utf-8", "unicode20utf8": "utf-8", "x-unicode20utf8": "utf-8",
  "utf-16le": "utf-16le", "utf-16": "utf-16le", ucs2: "utf-16le", "ucs-2": "utf-16le", unicode: "utf-16le", "csunicode": "utf-16le", "iso-10646-ucs-2": "utf-16le", "unicodefeff": "utf-16le",
  "utf-16be": "utf-16be", "unicodefffe": "utf-16be",
  // As in browsers, Latin-1 labels decode as windows-1252.
  "windows-1252": "windows-1252", "iso-8859-1": "windows-1252", latin1: "windows-1252", "l1": "windows-1252", ascii: "windows-1252", "us-ascii": "windows-1252",
  "iso8859-1": "windows-1252", "iso_8859-1": "windows-1252", "cp1252": "windows-1252", "cp819": "windows-1252", "x-cp1252": "windows-1252", "ansi_x3.4-1968": "windows-1252",
};

// windows-1252's 0x80–0x9F (the rest is Latin-1).
const cp1252 = [
  0x20ac, 0x81, 0x201a, 0x192, 0x201e, 0x2026, 0x2020, 0x2021, 0x2c6, 0x2030, 0x160, 0x2039, 0x152, 0x8d, 0x17d, 0x8f,
  0x90, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x2dc, 0x2122, 0x161, 0x203a, 0x153, 0x9d, 0x17e, 0x178,
];

/** UTF-8 (native), UTF-16 (LE / BE) and windows-1252 (and its Latin-1 labels).
 * `decode(chunk, { stream: true })` keeps a character split across chunks
 * for the next call. */
export class TextDecoder {
  readonly encoding: Encoding;
  readonly fatal: boolean;
  readonly ignoreBOM: boolean;
  private pending = new Uint8Array(0);
  private started = false;

  constructor(label = "utf-8", options: { fatal?: boolean; ignoreBOM?: boolean } = {}) {
    const encoding = labels[String(label).trim().toLowerCase()];
    if (!encoding) throw new RangeError(`TextDecoder: unsupported encoding "${label}" (utf-8, utf-16le, utf-16be and windows-1252 / latin1 are)`);
    this.encoding = encoding;
    this.fatal = !!options.fatal;
    this.ignoreBOM = !!options.ignoreBOM;
  }

  decode(input?: ArrayBuffer | ArrayBufferView, options?: { stream?: boolean }): string {
    const stream = !!options?.stream;
    let bytes = input === undefined ? new Uint8Array(0)
      : ArrayBuffer.isView(input) ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
      : new Uint8Array(input);
    if (this.pending.length) {
      const joined = new Uint8Array(this.pending.length + bytes.length);
      joined.set(this.pending);
      joined.set(bytes, this.pending.length);
      bytes = joined;
      this.pending = new Uint8Array(0);
    }
    if (stream) {
      const keep = this.incompleteTail(bytes);
      if (keep) {
        this.pending = bytes.slice(bytes.length - keep);
        bytes = bytes.subarray(0, bytes.length - keep);
      }
    }
    let text = this.decodeComplete(bytes, stream);
    if (!this.started && !this.ignoreBOM && text.charCodeAt(0) === 0xfeff) text = text.slice(1);
    if (text.length) this.started = true;
    if (!stream) this.started = false;
    return text;
  }

  /** How many bytes at the end start a character the next chunk finishes. */
  private incompleteTail(bytes: Uint8Array): number {
    const n = bytes.length;
    if (this.encoding === "windows-1252" || !n) return 0;
    if (this.encoding !== "utf-8") {
      let keep = n % 2;
      // A lead surrogate waits for its trail.
      if (n - keep >= 2) {
        const i = n - keep - 2;
        const unit = this.encoding === "utf-16le" ? bytes[i] | (bytes[i + 1] << 8) : (bytes[i] << 8) | bytes[i + 1];
        if (unit >= 0xd800 && unit <= 0xdbff) keep += 2;
      }
      return keep;
    }
    // The last lead byte, and whether its sequence is complete.
    for (let back = 1; back <= Math.min(3, n); back++) {
      const byte = bytes[n - back];
      if ((byte & 0xc0) === 0x80) continue;
      const size = byte >= 0xf0 ? 4 : byte >= 0xe0 ? 3 : byte >= 0xc0 ? 2 : 1;
      return size > back ? back : 0;
    }
    return 0;
  }

  private decodeComplete(bytes: Uint8Array, stream: boolean): string {
    if (this.encoding === "utf-8") {
      const text = __web.decodeUTF8(bytes, this.fatal);
      if (text === null) throw new TypeError("TextDecoder: the encoded data was not valid UTF-8");
      return text;
    }
    let out = "";
    if (this.encoding === "windows-1252") {
      for (let i = 0; i < bytes.length; i += 8192) {
        const codes = Array.from(bytes.subarray(i, i + 8192), (b) => (b >= 0x80 && b <= 0x9f ? cp1252[b - 0x80] : b));
        out += String.fromCharCode(...codes);
      }
      return out;
    }
    const little = this.encoding === "utf-16le";
    const even = bytes.length - (bytes.length % 2);
    const units: number[] = [];
    for (let i = 0; i < even; i += 2) units.push(little ? bytes[i] | (bytes[i + 1] << 8) : (bytes[i] << 8) | bytes[i + 1]);
    // Unpaired surrogates (and a final odd byte) are errors.
    for (let i = 0; i < units.length; i++) {
      const unit = units[i];
      const lead = unit >= 0xd800 && unit <= 0xdbff;
      const trail = unit >= 0xdc00 && unit <= 0xdfff;
      if (lead && units[i + 1] >= 0xdc00 && units[i + 1] <= 0xdfff) {
        i++;
      } else if (lead || trail) {
        if (this.fatal) throw new TypeError(`TextDecoder: the encoded data was not valid ${this.encoding}`);
        units[i] = 0xfffd;
      }
    }
    if (even < bytes.length && !stream) {
      if (this.fatal) throw new TypeError(`TextDecoder: the encoded data was not valid ${this.encoding}`);
      units.push(0xfffd);
    }
    for (let i = 0; i < units.length; i += 8192) out += String.fromCharCode(...units.slice(i, i + 8192));
    return out;
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
