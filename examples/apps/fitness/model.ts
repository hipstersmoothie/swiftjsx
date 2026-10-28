// Metrics, time ranges, and turning days into chart series and summaries.
import { addDays, addHours, addMinutes, format, isSameDay, startOfHour, startOfWeek, differenceInCalendarDays } from "date-fns";
import type { CalendarUnit, Color } from "swiftjsx";
import { getData, GOALS, STAGES, type Day, type Stage } from "./data";
import { STAGE_COLORS, STAGE_NAMES } from "./theme";
import { compact, dateRange, hoursMinutes, int, percentChange } from "./format";

export type Range = "D" | "W" | "M" | "6M";
export const RANGES: { value: Range; label: string }[] = [
  { value: "D", label: "D" },
  { value: "W", label: "W" },
  { value: "M", label: "M" },
  { value: "6M", label: "6M" },
];

export type MetricId = "steps" | "energy" | "exercise" | "stand" | "heart-rate" | "sleep";

export type Metric = {
  id: MetricId;
  title: string;
  unit: string;
  icon: string;
  color: Color;
  goal?: number;
  /** One number per day (sleep: hours asleep; heart rate: resting). */
  daily(d: Day): number;
  /** Text for a value in `daily`'s units. */
  text(v: number): string;
  about: string;
};

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const mean = (xs: number[]) => (xs.length ? sum(xs) / xs.length : 0);

export const METRICS: Record<MetricId, Metric> = {
  steps: {
    id: "steps", title: "Steps", unit: "steps", icon: "figure.walk", color: "orange", goal: GOALS.steps,
    daily: (d) => d.steps, text: (v) => int(v),
    about: "Step count is the number of steps you take throughout the day. Pedometers and digital activity trackers can help you determine your step count.",
  },
  energy: {
    id: "energy", title: "Active Energy", unit: "kcal", icon: "flame.fill", color: "#FA114F", goal: GOALS.move,
    daily: (d) => d.energy, text: (v) => int(v),
    about: "Active energy is the energy you burn above your resting energy: walking, workouts, even climbing the stairs. It fills your Move ring.",
  },
  exercise: {
    id: "exercise", title: "Exercise Minutes", unit: "min", icon: "figure.run", color: "#7BD300", goal: GOALS.exercise,
    daily: (d) => d.exercise, text: (v) => int(v),
    about: "Every full minute of movement that equals or exceeds the intensity of a brisk walk counts towards your Exercise ring.",
  },
  stand: {
    id: "stand", title: "Stand Hours", unit: "hr", icon: "figure.stand", color: "#00C7DE", goal: GOALS.stand,
    daily: (d) => d.stand, text: (v) => (Number.isInteger(v) ? `${v}` : v.toFixed(1)),
    about: "Stand hours count the hours in which you stood up and moved around for at least a minute. Twelve is the goal.",
  },
  "heart-rate": {
    id: "heart-rate", title: "Heart Rate", unit: "BPM", icon: "heart.fill", color: "#FF375F",
    daily: (d) => d.restingHR, text: (v) => int(v),
    about: "Your heart rate is the number of times your heart beats per minute. The range shows your lowest and highest readings; the line is the average.",
  },
  sleep: {
    id: "sleep", title: "Sleep", unit: "hr", icon: "bed.double.fill", color: "#3A82F7", goal: GOALS.sleepHours,
    daily: (d) => d.sleep.asleep / 60, text: (v) => hoursMinutes(v * 60),
    about: "Sleep stages show how much time you spent in REM, Core and Deep sleep, and how often you woke up during the night.",
  },
};

export const METRIC_ORDER: MetricId[] = ["steps", "energy", "exercise", "stand", "heart-rate", "sleep"];

// MARK: Chart series

export type ChartKind = "bars" | "range" | "stacked" | "line" | "timeline";

export type ChartPoint = {
  /** Title of the slot when selected ("Tue, Oct 21", "9 AM – 10 AM"). */
  label: string;
  /** Where the slot is: the start of its day / week / hour (with `unit`), or a number. */
  x: Date | number;
  /** Bar/line height; the average on range charts; the total on stacked ones. */
  value: number;
  min?: number;
  max?: number;
  /** Stacked: one value per part, bottom to top. */
  parts?: number[];
  /** Timeline: the stage at this slot. */
  stage?: Stage;
  empty?: boolean;
};

export type ChartData = {
  kind: ChartKind;
  points: ChartPoint[];
  /** Date x: the span each point stands for (bars fill it). */
  unit?: CalendarUnit;
  /** X-axis labels: at these x values, in this format (a `ChartAxis` format: "weekdayNarrow", "{}m"…). */
  ticks?: (Date | number)[];
  tickFormat?: string;
  /** The x span shown (default: the marks'). */
  xDomain?: [Date, Date];
  color: Color;
  partColors?: Color[];
  goal?: number;
  /** Timeline: lanes top to bottom, with their bars. */
  lanes?: { name: string; color: Color; bars: { from: Date; to: Date }[] }[];
  /** Line charts: a color per point (heart-rate zones). */
  pointColors?: Color[];
  /** Range charts: draw a line through the averages. */
  line?: boolean;
  /** Force the y scale to start here (default 0, or near the minimum for ranges and lines). */
  yFloor?: number;
};

type Bucket = { label: string; days: Day[]; from: Date; to: Date };

/** The x axis of a range's buckets: their unit and where labels go. */
function bucketAxis(range: Exclude<Range, "D">, list: Bucket[]): Pick<ChartData, "unit" | "ticks" | "tickFormat"> {
  if (range === "W") return { unit: "day", ticks: list.map((b) => b.from), tickFormat: "weekdayNarrow" };
  if (range === "M") return { unit: "day", ticks: list.filter((_, i) => i % 7 === 2).map((b) => b.from), tickFormat: "monthDay" };
  // 6M: a label on the first of each month.
  const today = getData().today;
  const months = list.flatMap((b) => [0, 1, 2, 3, 4, 5, 6].map((k) => addDays(b.from, k)).filter((d) => d.getDate() === 1 && d <= today));
  return { unit: "weekOfYear", ticks: months, tickFormat: "month" };
}

/** Today by the hour. */
function hourAxis(day: Day): Pick<ChartData, "unit" | "ticks" | "tickFormat"> {
  return { unit: "hour", ticks: [0, 6, 12, 18].map((h) => addHours(day.date, h)), tickFormat: "hour" };
}

/** Days (or weeks, for 6M) of a range, ending today; `back` = 1 is the period before. */
function buckets(range: Exclude<Range, "D">, back = 0): Bucket[] {
  const { days } = getData();
  const last = days.length - 1;
  if (range === "W" || range === "M") {
    const n = range === "W" ? 7 : 30;
    const end = last - back * n;
    return days.slice(Math.max(0, end - n + 1), end + 1).map((d) => ({
      label: format(d.date, "EEE, MMM d"),
      days: [d],
      from: d.date,
      to: d.date,
    }));
  }
  // 6M: 26 weeks (Monday to Sunday), the last one being this week.
  const today = days[last].date;
  const firstWeek = addDays(startOfWeek(today, { weekStartsOn: 1 }), -7 * (25 + back * 26));
  const out: Bucket[] = [];
  for (let w = 0; w < 26; w++) {
    const from = addDays(firstWeek, w * 7);
    const to = addDays(from, 6);
    const inWeek = days.filter((d) => d.date >= from && d.date <= to);
    out.push({
      label: `${format(from, "MMM d")} – ${format(to > today ? today : to, "MMM d")}`,
      days: inWeek,
      from,
      to,
    });
  }
  return out;
}

const hourLabel = (h: number) => format(new Date(2000, 0, 1, h), "h a");

export function series(metric: Metric, range: Range): ChartData {
  const { days } = getData();
  const today = days[days.length - 1];
  const hourly = range === "D";

  if (metric.id === "sleep") {
    if (hourly) return sleepTimeline(today);
    const list = buckets(range);
    return {
      kind: "stacked",
      color: metric.color,
      partColors: [STAGE_COLORS.deep, STAGE_COLORS.core, STAGE_COLORS.rem, STAGE_COLORS.awake],
      goal: GOALS.sleepHours,
      ...bucketAxis(range, list),
      points: list.map((b) => {
        const parts = (["deep", "core", "rem", "awake"] as Stage[]).map((s) => mean(b.days.map((d) => d.sleep.totals[s])) / 60);
        return { label: b.label, x: b.from, value: sum(parts.slice(0, 3)), parts, empty: !b.days.length };
      }),
    };
  }

  if (metric.id === "heart-rate") {
    const list = hourly ? [] : buckets(range as Exclude<Range, "D">);
    const points: ChartPoint[] = hourly
      ? today.hourly.hrAvg.map((avg, h) => ({
          label: `${hourLabel(h)} – ${hourLabel((h + 1) % 24)}`,
          x: addHours(today.date, h),
          value: avg,
          min: today.hourly.hrMin[h],
          max: today.hourly.hrMax[h],
        }))
      : list.map((b) => ({
          label: b.label,
          x: b.from,
          value: Math.round(mean(b.days.map((d) => d.hrAvg))),
          min: Math.min(...b.days.map((d) => d.hrMin)),
          max: Math.max(...b.days.map((d) => d.hrMax)),
          empty: !b.days.length,
        }));
    const axis = hourly ? hourAxis(today) : bucketAxis(range as Exclude<Range, "D">, list);
    return { kind: "range", color: metric.color, points, line: true, ...axis };
  }

  const key = metric.id as "steps" | "energy" | "exercise" | "stand";
  if (hourly) {
    const points = today.hourly[key].map((v, h) => ({ label: `${hourLabel(h)} – ${hourLabel((h + 1) % 24)}`, x: addHours(today.date, h), value: v }));
    return { kind: "bars", color: metric.color, points, ...hourAxis(today) };
  }
  const list = buckets(range);
  const points = list.map((b) => ({ label: b.label, x: b.from, value: mean(b.days.map(metric.daily)), empty: !b.days.length }));
  return { kind: "bars", color: metric.color, points, goal: metric.goal, ...bucketAxis(range, list) };
}

/** Last night as a hypnogram: one lane per stage, in 5-minute slots. */
function sleepTimeline(day: Day): ChartData {
  const { sleep } = day;
  const SLOT = 5;
  const length = (sleep.end.getTime() - sleep.start.getTime()) / 60_000;
  const count = Math.ceil(length / SLOT);
  const points: ChartPoint[] = [];
  for (let i = 0; i < count; i++) {
    const at = addMinutes(sleep.start, i * SLOT);
    const minute = i * SLOT;
    const stage = sleep.segments.find((s) => minute >= s.start && minute < s.end)?.stage ?? "awake";
    points.push({ label: format(at, "h:mm a"), x: at, value: 0, stage });
  }
  // A label every two hours, on the hour.
  const ticks: Date[] = [];
  for (let at = addHours(startOfHour(sleep.start), 1); at < sleep.end; at = addHours(at, 1)) if (at.getHours() % 2 === 0) ticks.push(at);
  return {
    kind: "timeline",
    color: STAGE_COLORS.core,
    points,
    ticks,
    tickFormat: "hour",
    xDomain: [sleep.start, sleep.end],
    lanes: STAGES.map((stage) => ({
      name: STAGE_NAMES[stage],
      color: STAGE_COLORS[stage],
      bars: sleep.segments.filter((s) => s.stage === stage).map((s) => ({ from: addMinutes(sleep.start, s.start), to: addMinutes(sleep.start, s.end) })),
    })),
  };
}

// MARK: Summaries

export type Headline = { caption: string; value: string; unit: string; detail: string };

function periodDays(range: Range, back = 0): Day[] {
  const { days } = getData();
  const last = days.length - 1;
  if (range === "D") return [days[last - back]];
  const n = range === "W" ? 7 : range === "M" ? 30 : 0;
  if (n) return days.slice(Math.max(0, last - (back + 1) * n + 1), last - back * n + 1);
  const all = buckets("6M", back).flatMap((b) => b.days);
  return all;
}

function periodDates(range: Range, back = 0) {
  if (range === "6M") {
    const b = buckets("6M", back);
    const { days } = getData();
    const today = days[days.length - 1].date;
    return { from: b[0].from, to: b[b.length - 1].to > today ? today : b[b.length - 1].to };
  }
  const d = periodDays(range, back);
  return { from: d[0].date, to: d[d.length - 1].date };
}

/** The big number above the chart: the period's average (or total, for one day). */
export function headline(metric: Metric, range: Range): Headline {
  const days = periodDays(range);
  const { from, to } = periodDates(range);
  const detail =
    metric.id === "sleep" && range === "D"
      ? `${format(days[0].sleep.start, "h:mm a")} – ${format(days[0].sleep.end, "h:mm a")}`
      : dateRange(from, to, getData().today);
  if (metric.id === "heart-rate") {
    return { caption: "RANGE", value: `${Math.min(...days.map((d) => d.hrMin))}–${Math.max(...days.map((d) => d.hrMax))}`, unit: "BPM", detail };
  }
  if (metric.id === "sleep") {
    const asleep = mean(days.map((d) => d.sleep.asleep));
    return { caption: range === "D" ? "TIME ASLEEP" : "AVG. TIME ASLEEP", ...splitDuration(asleep), detail };
  }
  const value = mean(days.map(metric.daily));
  return { caption: range === "D" ? "TOTAL" : "DAILY AVERAGE", value: metric.text(value), unit: metric.unit, detail };
}

/** The number above the chart while a slot is selected. */
export function selectionHeadline(metric: Metric, range: Range, data: ChartData, index: number): Headline {
  const p = data.points[index];
  if (data.kind === "timeline") return { caption: "SLEEP STAGE", value: STAGE_NAMES[p.stage ?? "awake"], unit: "", detail: p.label };
  if (data.kind === "range") return { caption: "RANGE", value: p.empty ? "—" : `${p.min}–${p.max}`, unit: "BPM", detail: p.label };
  if (data.kind === "stacked") return { caption: range === "6M" ? "AVG. TIME ASLEEP" : "TIME ASLEEP", ...splitDuration(p.value * 60), detail: p.label };
  const caption = range === "6M" ? "DAILY AVERAGE" : "TOTAL";
  return { caption, value: p.empty ? "—" : metric.text(p.value), unit: metric.unit, detail: p.label };
}

function splitDuration(minutes: number) {
  const m = Math.round(minutes);
  return { value: `${Math.floor(m / 60)} hr ${m % 60}`, unit: "min" };
}

export type Comparison = {
  sentence: string;
  current: { label: string; value: number; text: string };
  previous: { label: string; value: number; text: string };
  change: number;
};

const PERIOD_NAMES: Record<Range, [string, string]> = {
  D: ["Today", "Yesterday"],
  W: ["This Week", "Last Week"],
  M: ["Last 30 Days", "Previous 30 Days"],
  "6M": ["Last 6 Months", "Previous 6 Months"],
};

/** This period against the one before it. */
export function comparison(metric: Metric, range: Range): Comparison {
  const value = (days: Day[]) => mean(days.map(metric.daily));
  const current = value(periodDays(range));
  const previous = value(periodDays(range, 1));
  const night = metric.id === "sleep" && range === "D";
  const [now, before] = night ? ["Last Night", "The Night Before"] : PERIOD_NAMES[range];
  const change = percentChange(current, previous);
  const what =
    metric.id === "heart-rate" ? "resting heart rate" : metric.id === "sleep" ? "time asleep" : metric.id === "stand" ? "stand hours" : metric.title.toLowerCase();
  const plural = metric.id === "steps" || metric.id === "exercise" || metric.id === "stand";
  const direction = Math.abs(change) < 2 ? "about the same as" : change > 0 ? `${Math.abs(change)}% higher than` : `${Math.abs(change)}% lower than`;
  const period = range === "W" ? "this week" : `over the ${now.toLowerCase()}`;
  return {
    sentence:
      night
        ? `Your time asleep last night was ${direction} the night before.`
        : range === "D"
        ? `Your ${what} today ${plural ? "are" : "is"} ${direction} yesterday.`
        : `On average, your ${what} ${period} ${plural ? "were" : "was"} ${direction} ${before.toLowerCase()}.`,
    current: { label: now, value: current, text: `${metric.text(current)} ${metric.id === "sleep" ? "" : metric.unit}`.trim() },
    previous: { label: before, value: previous, text: `${metric.text(previous)} ${metric.id === "sleep" ? "" : metric.unit}`.trim() },
    change,
  };
}

export type Stat = { title: string; value: string; detail?: string; icon?: string; color?: Color };

/** Facts about the period, under the chart. */
export function stats(metric: Metric, range: Range): Stat[] {
  const days = periodDays(range);
  const today = getData().today;
  const best = (pick: (d: Day) => number, dir: 1 | -1) => days.reduce((a, b) => (dir * pick(b) > dir * pick(a) ? b : a));
  const when = (d: Day) => (isSameDay(d.date, today) ? "Today" : format(d.date, "EEE, MMM d"));

  if (metric.id === "heart-rate") {
    const lo = best((d) => d.hrMin, -1);
    const hi = best((d) => d.hrMax, 1);
    return [
      { title: "Resting", value: `${Math.round(mean(days.map((d) => d.restingHR)))} BPM`, detail: range === "D" ? "Today" : "Average", icon: "bed.double.fill", color: "#FF375F" },
      { title: "Walking Average", value: `${Math.round(mean(days.map((d) => d.walkingHR)))} BPM`, detail: range === "D" ? "Today" : "Average", icon: "figure.walk", color: "#FF375F" },
      { title: "Lowest", value: `${lo.hrMin} BPM`, detail: when(lo), icon: "arrow.down.heart.fill", color: "#5AC8FA" },
      { title: "Highest", value: `${hi.hrMax} BPM`, detail: when(hi), icon: "arrow.up.heart.fill", color: "#FF9F0A" },
    ];
  }

  if (metric.id === "sleep") {
    const clockOf = (dates: Date[]) => {
      // Average a time of day across midnight: minutes from noon.
      const minutes = mean(dates.map((d) => ((d.getHours() + 12) % 24) * 60 + d.getMinutes()));
      return format(addMinutes(new Date(2000, 0, 1, 12), minutes), "h:mm a");
    };
    const inBed = mean(days.map((d) => (d.sleep.end.getTime() - d.sleep.start.getTime()) / 60_000));
    const goalNights = days.filter((d) => d.sleep.asleep >= GOALS.sleepHours * 60).length;
    return [
      { title: range === "D" ? "Bedtime" : "Avg. Bedtime", value: clockOf(days.map((d) => d.sleep.start)), icon: "moon.fill", color: "#5E5CE6" },
      { title: range === "D" ? "Wake Up" : "Avg. Wake Up", value: clockOf(days.map((d) => d.sleep.end)), icon: "alarm.fill", color: "#FF9F0A" },
      { title: "Time in Bed", value: hoursMinutes(inBed), detail: range === "D" ? undefined : "Average", icon: "bed.double.fill", color: "#5AC8FA" },
      { title: "Goal Reached", value: range === "D" ? (goalNights ? "Yes" : "No") : `${goalNights} of ${days.length}`, detail: `${GOALS.sleepHours} hr goal`, icon: "target", color: "#30D158" },
    ];
  }

  if (range === "D" && metric.id === "stand") {
    const day = days[0];
    const stood = day.hourly.stand.map((v, h) => (v ? h : -1)).filter((h) => h >= 0);
    const at = (h: number | undefined) => (h === undefined ? "—" : format(new Date(2000, 0, 1, h), "h a"));
    return [
      { title: "Hours Stood", value: `${stood.length} of ${GOALS.stand}`, detail: stood.length >= GOALS.stand ? "Goal reached" : `${GOALS.stand - stood.length} to go`, icon: "figure.stand", color: metric.color },
      { title: "First Stand", value: at(stood[0]), icon: "sunrise.fill", color: "orange" },
      { title: "Last Stand", value: at(stood[stood.length - 1]), icon: "sunset.fill", color: "orange" },
      { title: "Yesterday", value: `${getData().days[getData().days.length - 2].stand} hr`, icon: "arrow.uturn.backward", color: "gray" },
    ];
  }

  if (range === "D") {
    const day = days[0];
    const key = metric.id as "steps" | "energy" | "exercise" | "stand";
    const hours = day.hourly[key];
    const peak = hours.indexOf(Math.max(...hours));
    const active = hours.filter((v) => v > 0).length;
    const goal = metric.goal ?? 0;
    return [
      { title: "Busiest Hour", value: `${metric.text(hours[peak])} ${metric.unit}`, detail: format(new Date(2000, 0, 1, peak), "h a"), icon: "chart.bar.fill", color: metric.color },
      { title: "Active Hours", value: `${active}`, detail: "with any activity", icon: "clock.fill", color: metric.color },
      { title: "Goal", value: `${int(goal)} ${metric.unit}`, detail: metric.daily(day) >= goal ? "Reached" : `${int(goal - metric.daily(day))} to go`, icon: "target", color: "#30D158" },
      { title: "Yesterday", value: `${metric.text(metric.daily(getData().days[getData().days.length - 2]))} ${metric.unit}`, icon: "arrow.uturn.backward", color: "gray" },
    ];
  }

  const hi = best(metric.daily, 1);
  const lo = best(metric.daily, -1);
  const goal = metric.goal ?? 0;
  const reached = days.filter((d) => metric.daily(d) >= goal).length;
  return [
    { title: "Best Day", value: `${metric.text(metric.daily(hi))} ${metric.unit}`, detail: when(hi), icon: "trophy.fill", color: "#FFD60A" },
    { title: "Lowest Day", value: `${metric.text(metric.daily(lo))} ${metric.unit}`, detail: when(lo), icon: "arrow.down.circle.fill", color: "gray" },
    { title: "Goal Reached", value: `${reached} of ${days.length} days`, detail: `${compact(goal)} ${metric.unit} goal`, icon: "target", color: "#30D158" },
    { title: "Total", value: `${compact(Math.round(sum(days.map(metric.daily))))} ${metric.unit}`, detail: `${days.length} days`, icon: "sum", color: metric.color },
  ];
}

/** Time in each sleep stage over the period (minutes per night). */
export function stageBreakdown(range: Range) {
  const days = periodDays(range);
  const totals = STAGES.map((stage) => ({ stage, minutes: mean(days.map((d) => d.sleep.totals[stage])) }));
  const all = sum(totals.map((t) => t.minutes)) || 1;
  return totals.map((t) => ({ ...t, share: t.minutes / all }));
}

// MARK: Trends (summary cards)

export type Trend = {
  /** Today's (or last night's) value. */
  latest: number;
  /** Weekly averages of the last 12 weeks, oldest first. */
  weekly: number[];
  /** Last 90 days vs. the whole year, in percent. */
  change: number;
  recent: number;
};

export function trend(metric: Metric): Trend {
  const { days } = getData();
  const values = days.map(metric.daily);
  const weekly: number[] = [];
  for (let w = 11; w >= 0; w--) {
    const end = values.length - w * 7;
    weekly.push(mean(values.slice(end - 7, end)));
  }
  const recent = mean(values.slice(-90));
  return { latest: values[values.length - 1], weekly, change: percentChange(recent, mean(values)), recent };
}

/** Days of the current week (Monday first) for the mini rings, with `null` for days still to come. */
export function thisWeek(): (Day | null)[] {
  const { days, today } = getData();
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  return [0, 1, 2, 3, 4, 5, 6].map((k) => {
    const date = addDays(monday, k);
    const back = differenceInCalendarDays(today, date);
    return back >= 0 ? days[days.length - 1 - back] : null;
  });
}
