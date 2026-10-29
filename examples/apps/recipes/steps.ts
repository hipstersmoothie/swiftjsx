// Instructions → steps, and durations inside a step ("bake for 25 minutes")
// so cooking mode can offer timers.
//
// TheMealDB's instructions come in every shape: one line per step, "STEP 1"
// headers on their own line, "01.Put the potatoes…", bullets, or a single
// paragraph. We normalize all of them into short, readable steps.

import { format } from "swiftjsx";

const MAX_STEP = 320;
const TARGET_STEP = 220;

export function splitSteps(instructions: string): string[] {
  const lines = instructions
    .replace(/\r\n?/g, "\n")
    .split(/\n+/)
    .map((line) => line.trim())
    // "STEP 1", "Step 2:", "3." alone on a line are headers, not steps.
    .filter((line) => line && !/^(?:step\s*\d+\s*[:.)-]?|\d+\s*[.)]?)$/i.test(line))
    // "01.Put…", "2) Add…", "Step 3: Mix…", "• Stir…", "*Meanwhile…"
    .map((line) => line.replace(/^(?:step\s*\d+\s*[:.)-]?\s*|\d{1,2}\s*[.)]\s*(?=\D)|[•*\-–]\s*)/i, "").trim())
    .filter(Boolean);

  const steps: string[] = [];
  let carry = "";
  for (const line of lines) {
    // "For the sauce:" belongs with what follows.
    if (/:$/.test(line) && line.length < 60) {
      carry = carry ? `${carry} ${line}` : line;
      continue;
    }
    const full = carry ? `${carry} ${line}` : line;
    carry = "";
    if (full.length <= MAX_STEP) steps.push(full);
    else steps.push(...chunkSentences(full));
  }
  if (carry) steps.push(carry);
  // Merge crumbs ("Serve.", "Enjoy!") into the step before them.
  const merged: string[] = [];
  for (const step of steps) {
    if (merged.length && step.length < 16) merged[merged.length - 1] += ` ${step}`;
    else merged.push(step);
  }
  return merged.map(capitalizeFirst);
}

function chunkSentences(paragraph: string): string[] {
  // Split after . ! ? followed by a space and a capital/digit; keeps "approx. 5" together.
  const sentences = paragraph.split(/(?<=[.!?])\s+(?=[A-Z0-9(])/);
  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if (current && current.length + sentence.length + 1 > TARGET_STEP) {
      chunks.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

const capitalizeFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// MARK: Durations

export type Duration = {
  /** Where it is in the step text (for highlighting). */
  start: number;
  end: number;
  /** Seconds for the timer: the low end of a range ("20–25 minutes" → 20). */
  seconds: number;
  /** The high end of a range, if any. */
  maxSeconds?: number;
  /** "Bake", "Simmer"… or "Timer". */
  label: string;
  /** "25 min", "1 hr 30 min", "20–25 min". */
  display: string;
};

const WORDS: Record<string, number> = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, "forty-five": 45, fifty: 50, sixty: 60, ninety: 90,
};
const FRACTIONS: Record<string, number> = { "½": 0.5, "¼": 0.25, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3 };

const NUMBER = String.raw`(?:\d+(?:[.,]\d+)?\s*[½¼¾⅓⅔]?|[½¼¾⅓⅔]|forty-five|an?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|sixty|ninety)`;
const UNIT = String.raw`(hours?|hrs?|minutes?|mins?|seconds?|secs?)`;
const DURATION = new RegExp(
  String.raw`\b(half an?\s+hour|(${NUMBER})(?:\s*(?:-|–|to|or)\s*(${NUMBER}))?\s*(?:more\s+|additional\s+|extra\s+|further\s+)?-?\s*${UNIT})\b`,
  "gi",
);

// Most specific first: "Bake in the preheated oven" is baking, "cook and stir" is cooking.
const VERBS = [
  "bake", "roast", "grill", "broil", "fry", "sear", "simmer", "boil", "poach", "steam", "braise", "stew", "toast",
  "microwave", "smoke", "cook", "marinate", "soak", "rise", "prove", "knead", "chill", "refrigerate", "freeze", "rest",
  "stand", "cool", "reduce", "infuse", "steep", "whisk", "beat", "blend", "stir", "mix", "caramelise", "caramelize",
  "saute", "sauté", "heat", "brown", "leave", "drain", "preheat",
];

const VERB_LABEL: Record<string, string> = { stand: "Rest", leave: "Rest", saute: "Sauté", prove: "Rise" };

// "bake", "bakes", "baking" (not "baked": "cooked chicken", "preheated oven" are adjectives).
const verbPattern = (verb: string) =>
  new RegExp(String.raw`\b(?:${verb}|${verb}s|${verb.endsWith("e") ? verb.slice(0, -1) : verb}ing)\b`);
const VERB_PATTERNS = VERBS.map((verb) => [verb, verbPattern(verb)] as const);

function toNumber(token: string): number | null {
  const t = token.trim().toLowerCase();
  if (t in WORDS) return WORDS[t];
  const m = t.match(/^(\d+(?:[.,]\d+)?)?\s*([½¼¾⅓⅔])?$/);
  if (!m || (!m[1] && !m[2])) return null;
  return (m[1] ? Number(m[1].replace(",", ".")) : 0) + (m[2] ? FRACTIONS[m[2]] : 0);
}

const unitSeconds = (unit: string) => (/^h/i.test(unit) ? 3600 : /^m/i.test(unit) ? 60 : 1);
const unitShort = (unit: string) => (/^h/i.test(unit) ? "hr" : /^m/i.test(unit) ? "min" : "sec");
const formatNumber = (n: number) => (Number.isInteger(n) ? String(n) : n === 0.5 ? "½" : String(Math.round(n * 10) / 10).replace(/\.5$/, "½"));

/** "45 sec", "25 min", "1 hr 5 min". */
export const formatDuration = (seconds: number) => format.duration(seconds, "abbreviated");

/** The most telling cooking verb in the clause before `index`, as a label. */
function labelBefore(text: string, from: number, index: number): string {
  const sentenceStart = Math.max(text.lastIndexOf(". ", index), text.lastIndexOf("; ", index), from - 1) + 1;
  const clause = text.slice(sentenceStart, index).toLowerCase();
  const hit = VERB_PATTERNS.find(([, pattern]) => pattern.test(clause));
  if (!hit) return "Timer";
  const verb = hit[0];
  return VERB_LABEL[verb] ?? verb.charAt(0).toUpperCase() + verb.slice(1);
}

export function findDurations(step: string): Duration[] {
  const found: Duration[] = [];
  for (const match of step.matchAll(DURATION)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    let seconds: number;
    let maxSeconds: number | undefined;
    const unitOf = match[4] ? unitSeconds(match[4]) : 60;
    const short = match[4] ? unitShort(match[4]) : "min";
    if (/^half/i.test(match[1])) {
      seconds = 1800;
    } else {
      const unit = unitSeconds(match[4]);
      const low = toNumber(match[2]);
      const high = match[3] ? toNumber(match[3]) : null;
      if (low == null || low <= 0) continue;
      seconds = low * unit;
      if (high != null && high > low) maxSeconds = high * unit;
    }
    // "1 hour 30 minutes" / "1 hr and 15 mins": fold into the previous match.
    const previous = found[found.length - 1];
    if (previous && !previous.maxSeconds && !maxSeconds && /^\s*(?:and|,)?\s*$/i.test(step.slice(previous.end, start)) && previous.seconds >= 3600 && seconds < 3600) {
      previous.seconds += seconds;
      previous.end = end;
      previous.display = formatDuration(previous.seconds);
      continue;
    }
    if (seconds > 48 * 3600) continue;
    found.push({
      start,
      end,
      seconds,
      maxSeconds,
      label: labelBefore(step, previous?.end ?? 0, start),
      display: maxSeconds ? `${formatNumber(seconds / unitOf)}–${formatNumber(maxSeconds / unitOf)} ${short}` : formatDuration(seconds),
    });
  }
  return found;
}
