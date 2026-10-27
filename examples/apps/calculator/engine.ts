// The calculator as a reducer, with the iOS Calculator's immediate-execution
// semantics (no precedence: 2 + 3 × 4 = 20):
//
// - An operator applies the pending one first: `2 + 3 ×` shows 5.
// - Pressing operators back to back just switches the pending one.
// - `=` repeats: `2 + 3 = =` gives 8; `5 + =` gives 10.
// - `%` is a percentage of the first operand after + or − (`200 + 10 %` → 20),
//   else divides by 100.
// - C clears the current entry (the pending operation stays); AC clears all.
import {
  add, subtract, multiply, divide, power, factorial, clamp, compare, negate, parse, fromNumber, toNumber, serialize,
  isZero, isInteger, isNegative, magnitude, ZERO, ONE, HUNDRED, type Dec,
} from "./decimal";
import { formatValue, localize, plainValue } from "./format";

export type Op = "+" | "-" | "*" | "/" | "pow";
export type UnaryFn = "square" | "sqrt" | "inverse" | "ln" | "log10" | "exp" | "sin" | "cos" | "tan" | "factorial";
export type Angle = "deg" | "rad";

export type HistoryEntry = {
  id: string;
  /** ms since 1970. */
  at: number;
  /** Serialized decimals (see `serialize`), formatted when shown. */
  a: string;
  op: Op;
  b: string;
  result: string;
};

export type CalcState = {
  /** What the user is typing (ASCII, e.g. "-12.50"), or null when showing `value`. */
  entry: string | null;
  value: Dec;
  /** The first operand of `op`. */
  acc: Dec | null;
  op: Op | null;
  /** The operator was just pressed: it's highlighted, and the next digit starts a new number. */
  awaiting: boolean;
  /** What `=` repeats. */
  repeat: { op: Op; operand: Dec } | null;
  error: boolean;
  /** The gray line above the result. */
  expression: string;
  history: HistoryEntry[];
  scientific: boolean;
  angle: Angle;
};

export type Action =
  | { type: "digit"; digit: string }
  | { type: "point" }
  | { type: "clear" }
  | { type: "negate" }
  | { type: "percent" }
  | { type: "op"; op: Op }
  | { type: "equals"; id: string; at: number }
  | { type: "backspace" }
  | { type: "unary"; fn: UnaryFn }
  | { type: "constant"; value: Dec; label: string }
  | { type: "toggleAngle" }
  | { type: "recall"; value: Dec }
  | { type: "setScientific"; on: boolean }
  | { type: "deleteHistory"; id: string }
  | { type: "clearHistory" };

/** Digits that fit on the display (and that you can type). */
export const maxDigits = (s: { scientific: boolean }) => (s.scientific ? 15 : 9);
export const MAX_HISTORY = 200;

export const opSymbol: Record<Op, string> = { "+": "+", "-": "−", "*": "×", "/": "÷", pow: "^" };

export function initialState(saved?: Partial<Pick<CalcState, "history" | "scientific" | "angle">>): CalcState {
  return {
    entry: null,
    value: ZERO,
    acc: null,
    op: null,
    awaiting: false,
    repeat: null,
    error: false,
    expression: "",
    history: saved?.history ?? [],
    scientific: saved?.scientific ?? false,
    angle: saved?.angle ?? "deg",
  };
}

/** What the display shows. */
export function displayText(s: CalcState): string {
  if (s.error) return "Error";
  return s.entry !== null ? localize(s.entry) : formatValue(s.value, maxDigits(s));
}

/** The displayed number, unlocalized (for Copy). */
export function displayPlain(s: CalcState): string | null {
  if (s.error) return null;
  return s.entry !== null ? s.entry.replace(/\.$/, "") : plainValue(s.value, maxDigits(s));
}

/** C while there's an entry to clear, AC otherwise. */
export const showsClearEntry = (s: CalcState) => s.error || s.entry !== null;

/** The operator key that's highlighted. */
export const activeOp = (s: CalcState) => (s.awaiting ? s.op : null);

const current = (s: CalcState): Dec => (s.entry !== null ? (parse(s.entry) ?? ZERO) : s.value);

export function apply(a: Dec, op: Op, b: Dec): Dec | null {
  switch (op) {
    case "+": return clamp(add(a, b));
    case "-": return clamp(subtract(a, b));
    case "*": return clamp(multiply(a, b));
    case "/": return clamp(divide(a, b));
    case "pow": return power(a, b);
  }
}

const DEG = Math.PI / 180;

/** Exact answers at multiples of 90° (sin 180° is 0, not 1.2e-16). */
function trigDegrees(fn: "sin" | "cos" | "tan", x: Dec): Dec | null {
  const degrees = toNumber(x);
  if (isInteger(x) && magnitude(x) <= 15) {
    const turn = ((degrees % 360) + 360) % 360;
    if (turn % 90 === 0) {
      const quarter = turn / 90;
      const sin = [0, 1, 0, -1][quarter];
      const cos = [1, 0, -1, 0][quarter];
      if (fn === "sin") return fromNumber(sin);
      if (fn === "cos") return fromNumber(cos);
      return cos === 0 ? null : fromNumber(sin / cos);
    }
  }
  return trigRadians(fn, degrees * DEG);
}

function trigRadians(fn: "sin" | "cos" | "tan", radians: number): Dec | null {
  const r = fn === "sin" ? Math.sin(radians) : fn === "cos" ? Math.cos(radians) : Math.tan(radians);
  // sin(π) is 1.2e-16 in floats: call it zero. (Tiny angles keep tiny results.)
  if (Math.abs(r) < 1e-15 && Math.abs(radians) > 1e-3) return ZERO;
  if (fn === "tan" && Math.abs(r) > 1e15) return null;
  return fromNumber(r);
}

export function applyUnary(fn: UnaryFn, x: Dec, angle: Angle): Dec | null {
  switch (fn) {
    case "square": return clamp(multiply(x, x));
    case "inverse": return clamp(divide(ONE, x));
    case "factorial": return factorial(x);
    case "sqrt": {
      if (isNegative(x)) return null;
      const root = fromNumber(Math.sqrt(toNumber(x)));
      // Exact roots stay exact: √(0.09) is 0.3.
      return root && compare(multiply(root, root), x) === 0 ? root : clamp(root);
    }
    case "ln":
      return isNegative(x) || isZero(x) ? null : clamp(fromNumber(Math.log(toNumber(x))));
    case "log10":
      if (isNegative(x) || isZero(x)) return null;
      // Powers of ten are exact: log₁₀(1000) is 3.
      if (x.c === 1n) return fromNumber(x.e);
      return clamp(fromNumber(Math.log10(toNumber(x))));
    case "exp": return clamp(fromNumber(Math.exp(toNumber(x))));
    case "sin":
    case "cos":
    case "tan":
      return angle === "deg" ? trigDegrees(fn, x) : trigRadians(fn, toNumber(x));
  }
}

export const unaryLabel: Record<UnaryFn, (x: string) => string> = {
  square: (x) => `(${x})²`,
  sqrt: (x) => `√(${x})`,
  inverse: (x) => `1/(${x})`,
  ln: (x) => `ln(${x})`,
  log10: (x) => `log₁₀(${x})`,
  exp: (x) => `e^(${x})`,
  sin: (x) => `sin(${x})`,
  cos: (x) => `cos(${x})`,
  tan: (x) => `tan(${x})`,
  factorial: (x) => `${x}!`,
};

const digitCount = (entry: string) => entry.replace(/[^0-9]/g, "").length;

/** Shows a value (a result, a constant, a recalled number). */
const showValue = (s: CalcState, value: Dec | null, expression?: string): CalcState =>
  value === null
    ? { ...s, entry: null, value: ZERO, error: true, awaiting: false, acc: null, op: null, repeat: null, expression: expression ?? s.expression }
    : { ...s, entry: null, value, error: false, awaiting: false, expression: expression ?? s.expression };

/** The pending part of the expression line: "12 ×". */
const pendingText = (s: CalcState) => (s.acc !== null && s.op ? `${formatValue(s.acc, maxDigits(s))} ${opSymbol[s.op]}` : "");

export function reduce(state: CalcState, action: Action): CalcState {
  // After an error, any key but C and the settings starts over.
  const s =
    state.error && !["clear", "toggleAngle", "setScientific", "deleteHistory", "clearHistory", "backspace"].includes(action.type)
      ? { ...initialState(state), expression: "" }
      : state;
  const fmt = (d: Dec) => formatValue(d, maxDigits(s));

  switch (action.type) {
    case "digit": {
      if (s.entry === null || s.entry === "0") return { ...s, entry: action.digit, awaiting: false, ...(s.op ? {} : { expression: "" }) };
      if (s.entry === "-0") return { ...s, entry: "-" + action.digit };
      if (digitCount(s.entry) >= maxDigits(s)) return s;
      return { ...s, entry: s.entry + action.digit };
    }
    case "point": {
      if (s.entry === null) return { ...s, entry: "0.", awaiting: false, ...(s.op ? {} : { expression: "" }) };
      if (s.entry.includes(".") || digitCount(s.entry) >= maxDigits(s)) return s;
      return { ...s, entry: s.entry + "." };
    }
    case "backspace": {
      if (s.error) return { ...initialState(s) };
      if (s.entry === null) return s;
      const shorter = s.entry.slice(0, -1);
      return { ...s, entry: shorter === "" || shorter === "-" ? "0" : shorter };
    }
    case "clear": {
      if (showsClearEntry(s)) {
        // C: drop the entry (the display shows 0); a pending operator lights up again.
        return { ...s, entry: null, value: ZERO, error: false, awaiting: s.op !== null, expression: s.error ? "" : s.expression };
      }
      return initialState(s);
    }
    case "negate": {
      if (s.entry !== null) return { ...s, entry: s.entry.startsWith("-") ? s.entry.slice(1) : "-" + s.entry };
      // Right after an operator, ± starts typing a negative number.
      if (s.awaiting) return { ...s, entry: "-0", awaiting: false };
      return { ...s, value: negate(s.value) };
    }
    case "percent": {
      const x = current(s);
      const additive = s.acc !== null && (s.op === "+" || s.op === "-") && !s.awaiting;
      return showValue(s, clamp(divide(additive ? multiply(s.acc!, x) : x, HUNDRED)));
    }
    case "op": {
      if (s.op && s.acc !== null && !s.awaiting) {
        const result = apply(s.acc, s.op, current(s));
        if (result === null) return showValue(s, null, `${pendingText(s)} ${fmt(current(s))}`);
        return { ...s, entry: null, value: result, acc: result, op: action.op, awaiting: true, repeat: null, expression: `${fmt(result)} ${opSymbol[action.op]}` };
      }
      const acc = s.awaiting && s.acc !== null ? s.acc : current(s);
      return { ...s, entry: null, value: acc, acc, op: action.op, awaiting: true, repeat: null, expression: `${fmt(acc)} ${opSymbol[action.op]}` };
    }
    case "equals": {
      let a: Dec, op: Op, b: Dec;
      if (s.op && s.acc !== null) {
        a = s.acc;
        op = s.op;
        b = s.awaiting ? s.acc : current(s);
      } else if (s.repeat) {
        a = current(s);
        op = s.repeat.op;
        b = s.repeat.operand;
      } else {
        return s.entry !== null ? { ...s, entry: null, value: current(s) } : s;
      }
      const result = apply(a, op, b);
      const expression = `${fmt(a)} ${opSymbol[op]} ${fmt(b)}`;
      if (result === null) return showValue(s, null, expression);
      const entry: HistoryEntry = { id: action.id, at: action.at, a: serialize(a), op, b: serialize(b), result: serialize(result) };
      return {
        ...s,
        entry: null,
        value: result,
        acc: null,
        op: null,
        awaiting: false,
        repeat: { op, operand: b },
        expression,
        history: [entry, ...s.history].slice(0, MAX_HISTORY),
      };
    }
    case "unary": {
      const x = current(s);
      const label = unaryLabel[action.fn](fmt(x));
      return showValue(s, applyUnary(action.fn, x, s.angle), [pendingText(s), label].filter(Boolean).join(" "));
    }
    case "constant":
      return showValue(s, action.value, [pendingText(s), action.label].filter(Boolean).join(" "));
    case "recall":
      return showValue({ ...s, error: false }, action.value, s.op ? s.expression : "");
    case "toggleAngle":
      return { ...s, angle: s.angle === "deg" ? "rad" : "deg" };
    case "setScientific":
      return { ...s, scientific: action.on };
    case "deleteHistory":
      return { ...s, history: s.history.filter((h) => h.id !== action.id) };
    case "clearHistory":
      return { ...s, history: [] };
  }
}

/** Reads a serialized history value (falls back to zero for corrupt storage). */
export const decode = (text: string): Dec => parse(text) ?? ZERO;
