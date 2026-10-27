// A small exact decimal type on BigInt: `c × 10^e`. Addition, subtraction and
// multiplication are exact (0.1 + 0.2 is 0.3); division and the scientific
// functions round to a fixed number of significant digits.

/** `c × 10^e`, normalized: `c` has no trailing zeros (zero is `{ c: 0n, e: 0 }`). */
export type Dec = { readonly c: bigint; readonly e: number };

export const ZERO: Dec = { c: 0n, e: 0 };
export const ONE: Dec = { c: 1n, e: 0 };
export const HUNDRED: Dec = { c: 1n, e: 2 };

/** Significant digits kept for division and between operations. */
export const PRECISION = 34;
/** Past 10^±LIMIT a result is an error (or zero, for tiny ones). */
const LIMIT = 300;

const pow10 = (n: number) => 10n ** BigInt(n);
const abs = (n: bigint) => (n < 0n ? -n : n);

function norm(c: bigint, e: number): Dec {
  if (c === 0n) return ZERO;
  while (c % 10n === 0n) {
    c /= 10n;
    e++;
  }
  return { c, e };
}

/** Number of digits in the coefficient. */
export const digits = (d: Dec) => abs(d.c).toString().length;
/** Position of the decimal point from the first digit: 123.4 → 3, 0.05 → -1. */
export const magnitude = (d: Dec) => digits(d) + d.e;

export const isZero = (d: Dec) => d.c === 0n;
export const isNegative = (d: Dec) => d.c < 0n;
export const isInteger = (d: Dec) => d.e >= 0;

/** Parses "-12.50", ".5", "1e-7", "1.2345E+21" (and our own `c` "e" `e` form). */
export function parse(text: string): Dec | null {
  const m = /^([+-])?(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(text.trim());
  if (!m || (m[2] === "" && (m[3] ?? "") === "")) return null;
  const fraction = m[3] ?? "";
  const c = BigInt((m[2] || "0") + fraction);
  return norm(m[1] === "-" ? -c : c, Number(m[4] ?? 0) - fraction.length);
}

/** A float, cut to 15 significant digits (so float noise like 0.30000000000000004 goes). */
export function fromNumber(n: number): Dec | null {
  if (!Number.isFinite(n)) return null;
  return parse(n.toPrecision(15));
}

export const toNumber = (d: Dec) => Number(`${d.c}e${d.e}`);

/** Compact, lossless form for storage: "15e-1". */
export const serialize = (d: Dec) => `${d.c}e${d.e}`;

/** Plain decimal notation, no exponent: "-0.0012", "1500". */
export function toPlain(d: Dec): string {
  const sign = d.c < 0n ? "-" : "";
  const s = abs(d.c).toString();
  if (d.e >= 0) return sign + s + "0".repeat(d.e);
  const point = s.length + d.e;
  return point > 0 ? `${sign}${s.slice(0, point)}.${s.slice(point)}` : `${sign}0.${"0".repeat(-point)}${s}`;
}

export const negate = (d: Dec): Dec => ({ c: -d.c, e: d.e });

export function add(a: Dec, b: Dec): Dec {
  const e = Math.min(a.e, b.e);
  return norm(a.c * pow10(a.e - e) + b.c * pow10(b.e - e), e);
}

export const subtract = (a: Dec, b: Dec) => add(a, negate(b));
export const multiply = (a: Dec, b: Dec) => norm(a.c * b.c, a.e + b.e);
export const compare = (a: Dec, b: Dec) => {
  const c = subtract(a, b).c;
  return c === 0n ? 0 : c < 0n ? -1 : 1;
};

/** Rounds half away from zero so the result is a multiple of 10^exponent. */
export function roundTo(d: Dec, exponent: number): Dec {
  if (d.e >= exponent) return d;
  const divisor = pow10(exponent - d.e);
  let q = d.c / divisor;
  const r = abs(d.c % divisor);
  if (r * 2n >= divisor) q += d.c < 0n ? -1n : 1n;
  return norm(q, exponent);
}

/** Rounds to `n` significant digits. */
export function roundSignificant(d: Dec, n: number): Dec {
  const extra = digits(d) - n;
  return extra > 0 ? roundTo(d, d.e + extra) : d;
}

/** `a / b` to PRECISION significant digits; null for division by zero. */
export function divide(a: Dec, b: Dec, precision = PRECISION): Dec | null {
  if (isZero(b)) return null;
  if (isZero(a)) return ZERO;
  // Enough extra digits that the quotient has precision + 2 of them.
  const shift = Math.max(0, precision + 2 + digits(b) - digits(a));
  return roundSignificant(norm((a.c * pow10(shift)) / b.c, a.e - b.e - shift), precision);
}

/**
 * Keeps a result in range: PRECISION digits, null when it overflows and zero
 * when it underflows.
 */
export function clamp(d: Dec | null): Dec | null {
  if (d === null || isZero(d)) return d;
  const r = roundSignificant(d, PRECISION);
  const m = magnitude(r);
  if (m > LIMIT) return null;
  if (m < -LIMIT) return ZERO;
  return r;
}

/** Exact integer power for small integer exponents; floats otherwise. */
export function power(base: Dec, exponent: Dec): Dec | null {
  if (isInteger(exponent) && magnitude(exponent) <= 4) {
    let n = Number(exponent.c * pow10(exponent.e));
    if (isZero(base) && n < 0) return null;
    const negative = n < 0;
    n = Math.abs(n);
    let result = ONE;
    let square = base;
    while (n > 0) {
      if (n & 1) result = roundSignificant(multiply(result, square), PRECISION + 4);
      square = roundSignificant(multiply(square, square), PRECISION + 4);
      n >>= 1;
      if (magnitude(result) > 2 * LIMIT) return null;
    }
    return clamp(negative ? divide(ONE, result) : result);
  }
  return clamp(fromNumber(Math.pow(toNumber(base), toNumber(exponent))));
}

/** n! for whole numbers up to 1000, exactly. */
export function factorial(d: Dec): Dec | null {
  if (!isInteger(d) || isNegative(d) || magnitude(d) > 4) return null;
  const n = d.c * pow10(d.e);
  if (n > 1000n) return null;
  let result = 1n;
  for (let i = 2n; i <= n; i++) result *= i;
  return clamp(norm(result, 0));
}
