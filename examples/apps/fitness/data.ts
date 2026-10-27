// Deterministic fake health data: a year of days (the app shows the last 90
// in lists, and 6M charts compare against the 6 months before) with hourly
// steps, energy, exercise, stand and heart rate, a night of sleep stages, and
// workouts. Every day is seeded by its calendar date, so the same date always
// gets the same numbers.
import { addDays, addMinutes, differenceInCalendarDays, startOfDay } from "date-fns";

export const DAYS = 365;

export type WorkoutType = "run" | "walk" | "cycle" | "strength" | "yoga" | "hiit" | "swim";
export type Stage = "awake" | "rem" | "core" | "deep";
export const STAGES: Stage[] = ["awake", "rem", "core", "deep"];

export type SleepSegment = { stage: Stage; start: number; end: number }; // minutes from `start`
export type Sleep = {
  start: Date;
  end: Date;
  segments: SleepSegment[];
  /** Minutes per stage. */
  totals: Record<Stage, number>;
  /** Minutes asleep (everything but awake). */
  asleep: number;
};

export type Workout = {
  id: string;
  type: WorkoutType;
  start: Date;
  minutes: number;
  energy: number;
  distanceKm?: number;
  avgHR: number;
  maxHR: number;
  elevation?: number;
  seed: number;
};

export type Day = {
  index: number;
  date: Date;
  steps: number;
  distanceKm: number;
  flights: number;
  energy: number;
  exercise: number;
  stand: number;
  restingHR: number;
  walkingHR: number;
  hrMin: number;
  hrMax: number;
  hrAvg: number;
  hourly: {
    steps: number[];
    energy: number[];
    exercise: number[];
    stand: number[];
    hrMin: number[];
    hrMax: number[];
    hrAvg: number[];
  };
  /** The night that ended this morning. */
  sleep: Sleep;
  workouts: Workout[];
};

export const GOALS = { move: 500, exercise: 30, stand: 12, steps: 10_000, sleepHours: 7.5 };

// MARK: Random numbers

function mulberry32(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(...parts: number[]) {
  let h = 2166136261;
  for (const p of parts) {
    h ^= p;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type Rng = ReturnType<typeof random>;

export function random(seed: number) {
  const next = mulberry32(seed);
  return {
    next,
    between: (lo: number, hi: number) => lo + next() * (hi - lo),
    int: (lo: number, hi: number) => Math.floor(lo + next() * (hi - lo + 1)),
    /** Normal distribution (Box–Muller). */
    normal: (mean: number, sd: number) => {
      const u = Math.max(next(), 1e-9);
      const v = next();
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    chance: (p: number) => next() < p,
    pick: <T,>(items: T[]) => items[Math.floor(next() * items.length)],
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const SEED = 20261027;
const EPOCH = new Date(2020, 0, 1);

// MARK: Workouts

const WEEK_PLAN: (WorkoutType | null)[][] = [
  // Sunday … Saturday: candidates for the day (null = rest).
  ["walk", "cycle", null],
  ["run", "run", "strength"],
  ["strength", "hiit", null],
  ["cycle", "run", "swim"],
  ["yoga", "strength", null],
  [null, null, "run"],
  ["run", "swim", "cycle"],
];

const WORKOUT_PROFILE: Record<WorkoutType, { minutes: [number, number]; hr: number; kcalPerMin: number; kmPerMin?: number; hour: number[] }> = {
  run: { minutes: [28, 58], hr: 152, kcalPerMin: 11.5, kmPerMin: 0.172, hour: [6, 7, 18] },
  walk: { minutes: [30, 70], hr: 108, kcalPerMin: 4.6, kmPerMin: 0.09, hour: [9, 12, 19] },
  cycle: { minutes: [35, 85], hr: 138, kcalPerMin: 9.2, kmPerMin: 0.42, hour: [7, 17, 9] },
  strength: { minutes: [35, 60], hr: 118, kcalPerMin: 6.3, hour: [18, 19, 7] },
  yoga: { minutes: [25, 50], hr: 92, kcalPerMin: 3.4, hour: [7, 20] },
  hiit: { minutes: [18, 32], hr: 158, kcalPerMin: 12.8, hour: [7, 18] },
  swim: { minutes: [30, 50], hr: 132, kcalPerMin: 9.6, kmPerMin: 0.042, hour: [7, 12] },
};

function makeWorkout(rng: Rng, date: Date, type: WorkoutType, fitness: number, id: string): Workout {
  const p = WORKOUT_PROFILE[type];
  const minutes = rng.int(p.minutes[0], p.minutes[1]);
  const start = addMinutes(date, rng.pick(p.hour) * 60 + rng.int(0, 45));
  const intensity = rng.normal(1, 0.06);
  const avgHR = Math.round(p.hr * intensity - fitness * 4);
  return {
    id,
    type,
    start,
    minutes,
    energy: Math.round(minutes * p.kcalPerMin * intensity),
    distanceKm: p.kmPerMin ? Math.round(minutes * p.kmPerMin * intensity * (1 + fitness * 0.06) * 100) / 100 : undefined,
    avgHR,
    maxHR: Math.round(avgHR + rng.between(12, 24)),
    elevation: type === "run" || type === "cycle" || type === "walk" ? rng.int(8, type === "cycle" ? 420 : 110) : undefined,
    seed: rng.int(1, 1e9),
  };
}

/** Heart rate per minute: warm-up, a noisy plateau (with intervals for HIIT), cool-down. */
export function workoutHeartRate(w: Workout): number[] {
  const rng = random(w.seed);
  const resting = 72;
  const out: number[] = [];
  let hr = resting + 20;
  for (let m = 0; m <= w.minutes; m++) {
    const warm = Math.min(m / 6, 1);
    const cool = Math.min((w.minutes - m) / 4, 1);
    let target = resting + (w.avgHR + 4 - resting) * Math.min(warm, cool);
    if (w.type === "hiit" || w.type === "strength") target += Math.sin(m / (w.type === "hiit" ? 1.6 : 3)) * (w.type === "hiit" ? 14 : 9);
    target += (m / Math.max(w.minutes, 1)) * 6; // cardiac drift
    hr += (target - hr) * 0.45 + rng.normal(0, 2.2);
    out.push(Math.round(clamp(hr, 60, w.maxHR)));
  }
  return out;
}

/** Pace (seconds per km) and average heart rate for each full kilometer. */
export function workoutSplits(w: Workout): { km: number; seconds: number; hr: number }[] {
  if (!w.distanceKm || w.type === "swim") return [];
  const rng = random(w.seed + 1);
  const average = (w.minutes * 60) / w.distanceKm;
  const splits = [];
  for (let km = 1; km <= Math.floor(w.distanceKm); km++) {
    const fade = (km / w.distanceKm) * 0.04 - 0.02;
    splits.push({ km, seconds: Math.round(average * (1 + fade + rng.normal(0, 0.025))), hr: Math.round(w.avgHR + rng.normal(km * 0.8 - 2, 2)) });
  }
  return splits;
}

// MARK: Sleep

function makeSleep(rng: Rng, morning: Date, weekend: boolean): Sleep {
  const bedtime = rng.normal(weekend ? 23.6 : 22.9, 0.45); // hours after the previous midnight
  const start = addMinutes(addDays(morning, -1), Math.round(bedtime * 60));
  const length = Math.round(clamp(rng.normal(weekend ? 8.0 : 7.25, 0.55), 5.2, 9.4) * 60);
  const segments: SleepSegment[] = [];
  let t = 0;
  const push = (stage: Stage, minutes: number) => {
    const end = Math.min(t + Math.max(1, Math.round(minutes)), length);
    if (end <= t) return;
    const last = segments[segments.length - 1];
    if (last && last.stage === stage) last.end = end;
    else segments.push({ stage, start: t, end });
    t = end;
  };
  push("awake", rng.between(4, 16));
  for (let cycle = 0; t < length; cycle++) {
    const minutes = rng.normal(92, 10);
    const deep = minutes * clamp(0.32 - cycle * 0.08 + rng.normal(0, 0.03), 0.02, 0.4);
    const rem = minutes * clamp(0.1 + cycle * 0.06 + rng.normal(0, 0.03), 0.05, 0.38);
    const core = minutes - deep - rem;
    push("core", core * 0.55);
    push("deep", deep);
    push("core", core * 0.45);
    push("rem", rem);
    if (rng.chance(0.45)) push("awake", rng.between(1, 7));
  }
  const totals: Record<Stage, number> = { awake: 0, rem: 0, core: 0, deep: 0 };
  for (const s of segments) totals[s.stage] += s.end - s.start;
  return { start, end: addMinutes(start, length), segments, totals, asleep: length - totals.awake };
}

// MARK: Days

const STEP_WEIGHTS = [0, 0, 0, 0, 0, 0, 0.015, 0.05, 0.08, 0.05, 0.045, 0.06, 0.095, 0.075, 0.05, 0.05, 0.06, 0.09, 0.1, 0.075, 0.05, 0.03, 0.015, 0.005];

function makeDay(index: number, date: Date): Day {
  const dayNumber = differenceInCalendarDays(date, EPOCH);
  const rng = random(hash(SEED, dayNumber));
  const dow = date.getDay();
  const weekend = dow === 0 || dow === 6;
  const fitness = index / DAYS; // slowly getting fitter over the year
  const season = Math.cos(((date.getMonth() - 6) / 12) * 2 * Math.PI); // more active in summer

  const plan = WEEK_PLAN[dow];
  const type = rng.chance(0.82) ? rng.pick(plan) : null;
  const workouts = type ? [makeWorkout(rng, date, type, fitness, `w${dayNumber}`)] : [];
  if (weekend && rng.chance(0.25)) workouts.push(makeWorkout(rng, date, "walk", fitness, `w${dayNumber}b`));

  const restingHR = Math.round(rng.normal(63 - fitness * 5, 1.6));
  const hourly = {
    steps: new Array<number>(24).fill(0),
    energy: new Array<number>(24).fill(0),
    exercise: new Array<number>(24).fill(0),
    stand: new Array<number>(24).fill(0),
    hrMin: new Array<number>(24).fill(0),
    hrMax: new Array<number>(24).fill(0),
    hrAvg: new Array<number>(24).fill(0),
  };

  // Everyday walking around.
  const baseSteps = clamp(rng.normal(weekend ? 6400 : 7300, 1500) * (1 + season * 0.08), 1800, 14000);
  for (let h = 0; h < 24; h++) hourly.steps[h] = Math.round(baseSteps * STEP_WEIGHTS[h] * rng.between(0.55, 1.45));

  // Workouts land in the hours they overlap.
  const workoutHours = new Map<number, { minutes: number; hr: number; maxHR: number }>();
  for (const w of workouts) {
    const startMinute = w.start.getHours() * 60 + w.start.getMinutes();
    const cadence = w.type === "run" ? 162 : w.type === "walk" ? 112 : w.type === "hiit" ? 60 : 0;
    for (let m = startMinute; m < startMinute + w.minutes && m < 24 * 60; m++) {
      const h = Math.floor(m / 60);
      hourly.steps[h] += cadence;
      hourly.energy[h] += w.energy / w.minutes;
      hourly.exercise[h] += 1;
      const prev = workoutHours.get(h) ?? { minutes: 0, hr: w.avgHR, maxHR: w.maxHR };
      workoutHours.set(h, { minutes: prev.minutes + 1, hr: w.avgHR, maxHR: Math.max(prev.maxHR, w.maxHR) });
    }
  }

  for (let h = 0; h < 24; h++) {
    const steps = hourly.steps[h];
    const walking = workoutHours.has(h) ? 0 : steps;
    hourly.energy[h] = Math.round(hourly.energy[h] + walking * 0.036 + (h >= 7 && h <= 22 ? rng.between(3, 9) : 0));
    hourly.exercise[h] = Math.min(60, Math.round(hourly.exercise[h] + Math.max(0, (walking - 1300) / 110)));
    hourly.stand[h] = h >= 7 && h <= 21 && (steps > 500 || rng.chance(0.55)) ? 1 : 0;

    const asleep = h < 6 || h >= 23;
    const workout = workoutHours.get(h);
    let avg = asleep ? restingHR - 5 + rng.normal(0, 1.5) : restingHR + 12 + Math.min(steps / 110, 22) + rng.normal(0, 3);
    let max = avg + (asleep ? rng.between(3, 7) : rng.between(10, 26));
    if (workout) {
      const share = workout.minutes / 60;
      avg = avg * (1 - share) + workout.hr * share;
      max = Math.max(max, workout.maxHR);
    }
    hourly.hrAvg[h] = Math.round(avg);
    hourly.hrMax[h] = Math.round(max);
    hourly.hrMin[h] = Math.round(Math.max(restingHR - (asleep ? 9 : 2), avg - rng.between(6, 14)));
  }

  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const steps = sum(hourly.steps);
  const awakeHours = hourly.hrAvg.slice(7, 22);
  return {
    index,
    date,
    steps,
    distanceKm: Math.round(steps * 0.00074 * 100) / 100,
    flights: Math.max(0, Math.round(rng.normal(9, 4) + (workouts.some((w) => w.type === "run") ? 4 : 0))),
    energy: sum(hourly.energy),
    exercise: sum(hourly.exercise),
    stand: sum(hourly.stand),
    restingHR,
    walkingHR: Math.round(restingHR + rng.normal(38, 3)),
    hrMin: Math.min(...hourly.hrMin),
    hrMax: Math.max(...hourly.hrMax),
    hrAvg: Math.round(sum(awakeHours) / awakeHours.length),
    hourly,
    sleep: makeSleep(rng, date, dow === 0 || dow === 6),
    workouts,
  };
}

/**
 * Today is staged to show off the rings: a morning run, Move past its goal
 * (so the ring laps itself), Exercise well past it, and Stand still going.
 */
function stageToday(day: Day): Day {
  const rng = random(hash(SEED, 7));
  const run = makeWorkout(rng, day.date, "run", 1, "today-run");
  const workout: Workout = { ...run, start: addMinutes(day.date, 7 * 60 + 4), minutes: 44, energy: 482, distanceKm: 7.42, avgHR: 151, maxHR: 171 };
  const scale = (xs: number[], total: number) => {
    const sum = xs.reduce((a, b) => a + b, 0) || 1;
    return xs.map((x) => Math.round((x / sum) * total));
  };
  const hourly = { ...day.hourly };
  hourly.energy = scale(hourly.energy.map((e, h) => (h === 7 ? e + 380 : e)), 642);
  hourly.exercise = scale(hourly.exercise.map((e, h) => (h === 7 ? 44 : e)), 52);
  hourly.steps = hourly.steps.map((s, h) => (h === 7 ? s + 6900 : s));
  let standing = 0;
  hourly.stand = hourly.stand.map((_, h) => (h >= 7 && standing < 9 ? (standing++, 1) : 0));
  hourly.hrAvg = hourly.hrAvg.map((v, h) => (h === 7 ? 146 : v));
  hourly.hrMax = hourly.hrMax.map((v, h) => (h === 7 ? 171 : v));
  const steps = hourly.steps.reduce((a, b) => a + b, 0);
  return {
    ...day,
    hourly,
    steps,
    distanceKm: Math.round(steps * 0.00074 * 100) / 100,
    energy: 642,
    exercise: 52,
    stand: 9,
    hrMax: 171,
    workouts: [workout],
  };
}

let cached: { days: Day[]; workouts: Workout[]; today: Date } | null = null;

/** All the days, oldest first (the last one is today), and every workout, newest first. */
export function getData() {
  const today = startOfDay(new Date());
  if (cached && cached.today.getTime() === today.getTime()) return cached;
  const days: Day[] = [];
  for (let i = 0; i < DAYS; i++) days.push(makeDay(i, addDays(today, i - (DAYS - 1))));
  days[DAYS - 1] = stageToday(days[DAYS - 1]);
  const workouts = days.flatMap((d) => d.workouts).sort((a, b) => b.start.getTime() - a.start.getTime());
  cached = { days, workouts, today };
  return cached;
}
