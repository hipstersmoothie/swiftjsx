// Turning numbers into display text: rounding to what fits, scientific
// notation for the rest, and the user's grouping and decimal separators.
//
// Intl.NumberFormat does the localizing when JavaScriptCore has it. Given a
// decimal *string* (Intl.NumberFormat v3) it formats it exactly, so we never
// go through a float. Without it (or with an older Intl that converts the
// string to a Number first) we group the digits ourselves.
import { isZero, magnitude, roundSignificant, roundTo, toPlain, type Dec } from "./decimal";

type Separators = { group: string; decimal: string };

function probe() {
  const hasIntl = typeof Intl === "object" && typeof Intl.NumberFormat === "function";
  if (!hasIntl) {
    return { kind: "none" as const, locale: "", separators: { group: ",", decimal: "." }, exactStrings: false };
  }
  let separators: Separators = { group: ",", decimal: "." };
  let locale = "";
  try {
    const nf = new Intl.NumberFormat();
    locale = nf.resolvedOptions().locale;
    if (typeof nf.formatToParts === "function") {
      for (const part of nf.formatToParts(1234567.5)) {
        if (part.type === "group") separators = { ...separators, group: part.value };
        if (part.type === "decimal") separators = { ...separators, decimal: part.value };
      }
    }
  } catch {
    // Keep the defaults.
  }
  let exactStrings = false;
  try {
    const plain = new Intl.NumberFormat("en-US", { useGrouping: false, maximumFractionDigits: 20 });
    exactStrings = plain.format("12345678901234567.25" as unknown as number) === "12345678901234567.25";
  } catch {
    exactStrings = false;
  }
  return { kind: "intl" as const, locale, separators, exactStrings };
}

const env = probe();
const separators = env.separators;

/** What the app found, for the History footer (and for reporting what JavaScriptCore supports). */
export const formattingInfo =
  env.kind === "none"
    ? "Intl is missing in this JavaScript engine: digits are grouped by hand."
    : env.exactStrings
      ? `Intl.NumberFormat (${env.locale}), formatting exact decimal strings.`
      : `Intl.NumberFormat (${env.locale}) without exact decimal strings: grouped by hand with its separators.`;

const formatters = new Map<number, Intl.NumberFormat>();
function formatter(fractionDigits: number) {
  let nf = formatters.get(fractionDigits);
  if (!nf) {
    nf = new Intl.NumberFormat(undefined, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
    formatters.set(fractionDigits, nf);
  }
  return nf;
}

function groupByHand(integer: string) {
  let out = "";
  for (let i = 0; i < integer.length; i++) {
    if (i > 0 && (integer.length - i) % 3 === 0) out += separators.group;
    out += integer[i];
  }
  return out;
}

/**
 * Localizes plain ASCII decimal text ("-1234.50", "12.") exactly as typed:
 * trailing zeros and a trailing decimal point stay.
 */
export function localize(plain: string): string {
  const negative = plain.startsWith("-");
  const [integer, fraction] = (negative ? plain.slice(1) : plain).split(".");
  const hasPoint = fraction !== undefined;
  if (env.kind === "intl" && env.exactStrings) {
    // `format` keeps "-0" negative, like the calculator should.
    const text = formatter(fraction?.length ?? 0).format(`${negative ? "-" : ""}${integer || "0"}${fraction ? "." + fraction : ""}` as unknown as number);
    return hasPoint && !fraction ? text + separators.decimal : text;
  }
  return (negative ? "-" : "") + groupByHand(integer || "0") + (hasPoint ? separators.decimal + fraction : "");
}

/** Undoes `localize` for pasted text: drops group separators, reads the decimal mark. */
export function delocalize(text: string): string {
  let s = text.trim().replace(/[\s  ]/g, "").replace(/[−–]/g, "-");
  if (separators.group) s = s.split(separators.group).join("");
  if (separators.decimal !== ".") s = s.split(separators.decimal).join(".");
  return s.replace(/,/g, "");
}

export type Shown = { plain: string } | { mantissa: string; exponent: number };

/**
 * What fits in `maxDigits` digits: plain notation when it does (rounding off
 * fraction digits), scientific otherwise, like the iOS Calculator.
 */
export function fit(value: Dec, maxDigits: number): Shown {
  if (isZero(value)) return { plain: "0" };
  const scientific = (d: Dec): Shown => {
    const m = roundSignificant(d, Math.max(3, maxDigits - 3));
    const s = toPlain({ c: m.c < 0n ? -m.c : m.c, e: 0 });
    const sign = m.c < 0n ? "-" : "";
    return { mantissa: sign + s[0] + (s.length > 1 ? "." + s.slice(1) : ""), exponent: magnitude(m) - 1 };
  };
  const r = roundSignificant(value, maxDigits);
  const integerDigits = magnitude(r);
  if (integerDigits > maxDigits) return scientific(r);
  if (integerDigits >= 1) {
    const rounded = roundTo(r, -(maxDigits - integerDigits));
    return magnitude(rounded) > maxDigits ? scientific(rounded) : { plain: toPlain(rounded) };
  }
  // Below 1: a few leading zeros are fine, beyond that use an exponent unless it's exact.
  const rounded = roundTo(r, -(maxDigits - 1));
  const exact = rounded.c === r.c && rounded.e === r.e;
  if (!isZero(rounded) && (exact || -integerDigits <= 3)) return { plain: toPlain(rounded) };
  return scientific(r);
}

/** Display text for a value. */
export function formatValue(value: Dec, maxDigits: number): string {
  const shown = fit(value, maxDigits);
  return "plain" in shown ? localize(shown.plain) : `${localize(shown.mantissa)}e${shown.exponent}`;
}

/** The same, unlocalized, for the clipboard. */
export function plainValue(value: Dec, maxDigits: number): string {
  const shown = fit(value, maxDigits);
  return "plain" in shown ? shown.plain : `${shown.mantissa}e${shown.exponent}`;
}

const dayFormat = env.kind === "intl" ? new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }) : null;
const timeFormat = env.kind === "intl" ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }) : null;

export const formatTime = (at: number) => timeFormat?.format(at) ?? new Date(at).toTimeString().slice(0, 5);

/** "Today", "Yesterday" or the date. */
export function formatDay(at: number, now: number) {
  const day = (t: number) => {
    const d = new Date(t);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };
  const days = Math.round((day(now) - day(at)) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return dayFormat?.format(at) ?? new Date(at).toDateString();
}
