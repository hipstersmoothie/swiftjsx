// Measures like "1 1/2 cups", "200g", "½ tsp", "2-3 cloves", "1 and 1/8 cup",
// "Juice of 1": parse the amount, scale it for the servings picker, and print
// it back the way a cook would write it (fractions for spoons and cups, round
// numbers for grams). Also aggregates ingredients for the shopping list.

const UNICODE_FRACTIONS: Record<string, string> = {
  "½": "1/2", "⅓": "1/3", "⅔": "2/3", "¼": "1/4", "¾": "3/4", "⅕": "1/5", "⅖": "2/5", "⅗": "3/5", "⅘": "4/5",
  "⅙": "1/6", "⅚": "5/6", "⅛": "1/8", "⅜": "3/8", "⅝": "5/8", "⅞": "7/8",
};

export type Measure = {
  /** null when there's nothing to scale ("Pinch", "To taste", "Garnish"). */
  amount: number | null;
  /** The high end of "2-3". */
  amountMax?: number;
  /** Text before the number ("Juice of"). */
  prefix: string;
  /** Everything after the number ("cups", "g", "large", "finely sliced"). */
  rest: string;
  raw: string;
};

const NUM = String.raw`\d+\s+\d+\/\d+|\d+\s+and\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?`;
const MEASURE = new RegExp(String.raw`^(.*?)(${NUM})(?:\s*(?:-|–|to)\s*(${NUM}))?(?![\d/])\s*(.*)$`, "i");

function parseNumber(s: string): number {
  const t = s.trim().replace(/\s+and\s+/, " ");
  const mixed = t.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const fraction = t.match(/^(\d+)\/(\d+)$/);
  if (fraction) return Number(fraction[2]) ? Number(fraction[1]) / Number(fraction[2]) : 0;
  return Number(t.replace(",", "."));
}

export function parseMeasure(raw: string): Measure {
  // "1½" → "1 1/2", "½" → "1/2"
  const text = raw.replace(/(\d)?([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/g, (_, d: string | undefined, f: string) => (d ? `${d} ` : "") + UNICODE_FRACTIONS[f]).trim();
  const m = text.match(MEASURE);
  // Only take a number near the start: "Grated zest of 1" yes, "Use 1 of the 2" no.
  if (!m || m[1].length > 18) return { amount: null, prefix: "", rest: text, raw };
  const amount = parseNumber(m[2]);
  if (!Number.isFinite(amount) || amount <= 0) return { amount: null, prefix: "", rest: text, raw };
  const max = m[3] ? parseNumber(m[3]) : undefined;
  return { amount, amountMax: max && max > amount ? max : undefined, prefix: m[1].trim(), rest: m[4].trim(), raw };
}

// MARK: Units

type UnitInfo = { key: string; label: string; metric?: boolean; toBase?: number; base?: string };

const UNITS: [RegExp, UnitInfo][] = [
  [/^(?:g|gr|grams?|gm)$/i, { key: "g", label: "g", metric: true }],
  [/^(?:kg|kilos?|kilograms?)$/i, { key: "g", label: "kg", metric: true, toBase: 1000 }],
  [/^(?:ml|millilit(?:re|er)s?)$/i, { key: "ml", label: "ml", metric: true }],
  [/^(?:cl)$/i, { key: "ml", label: "cl", metric: true, toBase: 10 }],
  [/^(?:l|lit(?:re|er)s?|ltrs?)$/i, { key: "ml", label: "l", metric: true, toBase: 1000 }],
  [/^(?:tsp|tsps|teaspoons?|t)$/i, { key: "tsp", label: "tsp" }],
  [/^(?:tbsp|tbsps|tbs|tbls|tblsp|tablespoons?|T)$/i, { key: "tbsp", label: "tbsp" }],
  [/^(?:cups?|c)$/i, { key: "cup", label: "cup" }],
  [/^(?:oz|ounces?)\.?$/i, { key: "oz", label: "oz" }],
  [/^(?:lbs?|pounds?)$/i, { key: "lb", label: "lb" }],
  [/^(?:qt|quarts?)$/i, { key: "qt", label: "qt" }],
  [/^(?:pints?|pt)$/i, { key: "pint", label: "pint" }],
  [/^(?:cloves?)$/i, { key: "clove", label: "clove" }],
  [/^(?:cans?|tins?)$/i, { key: "can", label: "can" }],
  [/^(?:sticks?)$/i, { key: "stick", label: "stick" }],
  [/^(?:slices?)$/i, { key: "slice", label: "slice" }],
  [/^(?:pinch(?:es)?)$/i, { key: "pinch", label: "pinch" }],
  [/^(?:handfuls?)$/i, { key: "handful", label: "handful" }],
];

/** The unit at the start of `rest`, and what follows it ("cups sifted" → cup, "sifted"). */
export function splitUnit(rest: string): { unit: UnitInfo | null; tail: string } {
  const m = rest.match(/^([A-Za-z]+\.?)\b\s*(.*)$/);
  if (!m) return { unit: null, tail: rest };
  for (const [pattern, info] of UNITS) {
    if (pattern.test(m[1].replace(/\.$/, ""))) return { unit: info, tail: m[2] };
  }
  return { unit: null, tail: rest };
}

// MARK: Formatting

const NICE_FRACTIONS: [number, string][] = [
  [1 / 8, "⅛"], [1 / 4, "¼"], [1 / 3, "⅓"], [3 / 8, "⅜"], [1 / 2, "½"], [5 / 8, "⅝"], [2 / 3, "⅔"], [3 / 4, "¾"], [7 / 8, "⅞"],
];

/** 1.5 → "1½", 0.333 → "⅓", 2.04 → "2". */
export function formatFraction(value: number): string {
  let whole = Math.floor(value);
  const frac = value - whole;
  if (frac < 1 / 16) return String(whole || (value > 0 ? "⅛" : "0"));
  if (frac > 15 / 16) return String(whole + 1);
  let best = NICE_FRACTIONS[0];
  for (const candidate of NICE_FRACTIONS) if (Math.abs(candidate[0] - frac) < Math.abs(best[0] - frac)) best = candidate;
  if (whole === 0) return best[1];
  if (best[0] === 1) whole += 1;
  return `${whole}${best[1]}`;
}

/** Grams and millilitres: whole numbers, rounded more as they grow. */
export function formatMetric(value: number): string {
  if (value < 10) return String(Math.round(value * 10) / 10);
  if (value < 100) return String(Math.round(value));
  if (value < 1000) return String(Math.round(value / 5) * 5);
  return String(Math.round(value / 10) * 10);
}

function formatAmount(value: number, metric: boolean): string {
  return metric ? formatMetric(value) : formatFraction(value);
}

/** Plural-aware unit label: "1 cup", "2 cups", "250 g". */
function unitLabel(unit: UnitInfo, value: number): string {
  if (unit.metric || ["tsp", "tbsp", "oz"].includes(unit.key)) return unit.label;
  if (unit.key === "pinch") return value > 1 ? "pinches" : "pinch";
  return value > 1 ? `${unit.label}s` : unit.label;
}

/** The measure, scaled by `factor`, as display text. Unscalable measures come back as written. */
export function scaleMeasure(raw: string, factor: number): string {
  const measure = parseMeasure(raw);
  if (measure.amount == null) return raw;
  if (factor === 1) return tidy(raw);
  const { unit, tail } = splitUnit(measure.rest);
  let value = measure.amount * factor;
  let max = measure.amountMax != null ? measure.amountMax * factor : undefined;
  let label = unit ? unitLabel(unit, max ?? value) : "";
  // 1250 g → 1.25 kg; 0.4 kg → 400 g
  if (unit?.metric && unit.toBase && value < 1) {
    value *= unit.toBase;
    if (max != null) max *= unit.toBase;
    label = unit.key;
  } else if (unit?.metric && !unit.toBase && value >= 1000 && (unit.key === "g" || unit.key === "ml")) {
    value /= 1000;
    if (max != null) max /= 1000;
    label = unit.key === "g" ? "kg" : "l";
  }
  const metric = !!unit?.metric;
  const amount = formatAmount(value, metric) + (max != null ? `–${formatAmount(max, metric)}` : "");
  return [measure.prefix, amount, label, unit ? tail : measure.rest].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

/** "1 1/2 cups " → "1½ cups" (same amount, nicer to read). */
function tidy(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b(\d+) (\d)\/(\d)\b/g, (_, w: string, n: string, d: string) => `${w}${formatFraction(Number(n) / Number(d))}`)
    .replace(/(^|\s)(\d)\/(\d)\b/g, (_, s: string, n: string, d: string) => `${s}${formatFraction(Number(n) / Number(d))}`);
}

// MARK: Shopping list

export type ListSource = { recipeId: string; recipeName: string; factor: number; ingredients: { name: string; measure: string }[] };

export type ListItem = {
  /** Stable across sessions: the checked state is keyed by it. */
  key: string;
  name: string;
  /** "450 g", "3 cups + 2 tbsp", "to taste". */
  amount: string;
  recipes: string[];
};

/** "Eggs", "egg ", "EGG" → "egg". Good enough to merge the same thing from two recipes. */
export function ingredientKey(name: string): string {
  const base = name.trim().toLowerCase().replace(/\s+/g, " ");
  if (/(?:ss|us|is)$/.test(base)) return base;
  if (/oes$/.test(base)) return base.slice(0, -2); // tomatoes → tomato
  if (/ies$/.test(base)) return `${base.slice(0, -3)}y`; // berries → berry
  return base.replace(/s$/, "");
}

export function aggregate(sources: ListSource[]): ListItem[] {
  type Bucket = { name: string; recipes: Set<string>; totals: Map<string, { value: number; unit: UnitInfo | null }>; notes: Set<string> };
  const buckets = new Map<string, Bucket>();
  for (const source of sources) {
    for (const ingredient of source.ingredients) {
      const key = ingredientKey(ingredient.name);
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { name: ingredient.name.trim(), recipes: new Set(), totals: new Map(), notes: new Set() };
        buckets.set(key, bucket);
      }
      bucket.recipes.add(source.recipeName);
      const measure = parseMeasure(ingredient.measure);
      if (measure.amount == null) {
        if (ingredient.measure.trim()) bucket.notes.add(ingredient.measure.trim().toLowerCase());
        continue;
      }
      const { unit } = splitUnit(measure.rest);
      // Ranges count as their high end: buy enough.
      const value = (measure.amountMax ?? measure.amount) * source.factor * (unit?.toBase ?? 1);
      const unitKey = unit?.key ?? "";
      const total = bucket.totals.get(unitKey);
      if (total) total.value += value;
      else bucket.totals.set(unitKey, { value, unit: unit ? { ...unit, toBase: undefined, label: unit.key } : null });
    }
  }
  const items: ListItem[] = [];
  for (const [key, bucket] of buckets) {
    const parts: string[] = [];
    for (const { value, unit } of bucket.totals.values()) {
      // Counts: buy whole things (6½ eggs → 7).
      if (!unit) parts.push(formatFraction(value > 1 ? Math.ceil(value - 0.01) : value));
      else if (unit.metric && value >= 1000) parts.push(`${formatMetric(value / 1000)} ${unit.key === "g" ? "kg" : "l"}`);
      else if (unit.metric) parts.push(`${formatMetric(value)} ${unit.label}`);
      else parts.push(`${formatFraction(value)} ${unitLabel(unit, value)}`);
    }
    if (!parts.length) parts.push(...bucket.notes);
    items.push({ key, name: bucket.name, amount: parts.join(" + "), recipes: [...bucket.recipes] });
  }
  return items.sort((a, b) => a.name.localeCompare(b.name));
}
