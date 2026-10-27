// The keys, as data: what each one looks like, its accessibility label and
// identifier (`key-<id>`), and what it does.
import { fromNumber, parse, type Dec } from "./decimal";
import type { Action, Op, UnaryFn } from "./engine";

export type KeyKind = "digit" | "function" | "operator" | "scientific";

export type KeySpec = {
  /** For `accessibilityIdentifier="key-<id>"`. */
  id: string;
  kind: KeyKind;
  /** Text label, or an SF Symbol (`symbol`). */
  text?: string;
  symbol?: string;
  label: string;
  /** Spans two columns (the 0 key). */
  wide?: boolean;
  /** The operator it selects (to highlight it while it's pending). */
  op?: Op;
  action: () => Action;
};

const digit = (d: string): KeySpec => ({ id: d, kind: "digit", text: d, label: d, wide: d === "0", action: () => ({ type: "digit", digit: d }) });
const op = (o: Op, id: string, symbol: string, label: string): KeySpec => ({ id, kind: "operator", symbol, label, op: o, action: () => ({ type: "op", op: o }) });
const sci = (id: string, text: string, label: string, fn: UnaryFn): KeySpec => ({ id, kind: "scientific", text, label, action: () => ({ type: "unary", fn }) });
const constant = (id: string, text: string, label: string, value: () => Dec): KeySpec => ({
  id, kind: "scientific", text, label, action: () => ({ type: "constant", value: value(), label: text }),
});

/** The basic pad, row by row. The clear key's look depends on state, see `clearKey`. */
export function basicRows(clearEntry: boolean): KeySpec[][] {
  return [
    [
      clearEntry
        ? { id: "C", kind: "function", text: "C", label: "Clear", action: () => ({ type: "clear" }) }
        : { id: "AC", kind: "function", text: "AC", label: "All clear", action: () => ({ type: "clear" }) },
      { id: "+/-", kind: "function", symbol: "plus.forwardslash.minus", label: "Change sign", action: () => ({ type: "negate" }) },
      { id: "%", kind: "function", symbol: "percent", label: "Percent", action: () => ({ type: "percent" }) },
      op("/", "/", "divide", "Divide"),
    ],
    [digit("7"), digit("8"), digit("9"), op("*", "*", "multiply", "Multiply")],
    [digit("4"), digit("5"), digit("6"), op("-", "-", "minus", "Subtract")],
    [digit("1"), digit("2"), digit("3"), op("+", "+", "plus", "Add")],
    [
      digit("0"),
      { id: ".", kind: "digit", text: ".", label: "Decimal point", action: () => ({ type: "point" }) },
      { id: "=", kind: "operator", symbol: "equal", label: "Equals", action: () => ({ type: "equals", id: crypto.randomUUID(), at: Date.now() }) },
    ],
  ];
}

/** Three extra columns on the left in scientific mode, row by row. */
export function scientificRows(angle: "deg" | "rad"): KeySpec[][] {
  return [
    [
      // Shows the current unit, like a toggle.
      { id: angle === "deg" ? "Deg" : "Rad", kind: "scientific", text: angle === "deg" ? "Deg" : "Rad", label: angle === "deg" ? "Degrees" : "Radians", action: () => ({ type: "toggleAngle" }) },
      constant("π", "π", "Pi", () => parse("3.14159265358979323846264338327950")!),
      constant("e", "e", "Euler's number", () => parse("2.71828182845904523536028747135266")!),
    ],
    [
      sci("x^2", "x²", "Square", "square"),
      { id: "x^y", kind: "scientific", text: "xʸ", label: "Power", op: "pow", action: () => ({ type: "op", op: "pow" }) },
      sci("1/x", "1/x", "Reciprocal", "inverse"),
    ],
    [
      { id: "sqrt", kind: "scientific", symbol: "x.squareroot", label: "Square root", action: () => ({ type: "unary", fn: "sqrt" }) },
      sci("ln", "ln", "Natural logarithm", "ln"),
      sci("log10", "log₁₀", "Logarithm base 10", "log10"),
    ],
    [sci("sin", "sin", "Sine", "sin"), sci("cos", "cos", "Cosine", "cos"), sci("tan", "tan", "Tangent", "tan")],
    [
      sci("x!", "x!", "Factorial", "factorial"),
      sci("e^x", "eˣ", "e to the x", "exp"),
      constant("Rand", "Rand", "Random number", () => fromNumber(Math.random())!),
    ],
  ];
}

const layouts = new Map<string, KeySpec[][]>();

/**
 * The rows for a state, cached so the key objects (and the worklets that
 * capture them) stay the same between renders.
 */
export function keyRows(clearEntry: boolean, scientific: boolean, angle: "deg" | "rad"): KeySpec[][] {
  const id = `${clearEntry}:${scientific}:${angle}`;
  let rows = layouts.get(id);
  if (!rows) {
    const basic = basicRows(clearEntry);
    rows = scientific ? scientificRows(angle).map((extra, i) => [...extra, ...basic[i]]) : basic;
    layouts.set(id, rows);
  }
  return rows;
}
