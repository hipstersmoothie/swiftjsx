// The Fitness charts, on Swift Charts. Each kind of ChartData is a set of
// marks over the points' x (a Date standing for its day / week / hour, or a
// number):
//   - bars: a BarMark per slot, and a dashed RuleMark for the goal;
//   - stacked: a BarMark per part (marks at the same x stack, bottom first);
//   - range: floating BarMarks from min to max, a LineMark through the averages;
//   - line: LineMarks, one series per run of the same color (heart-rate zones);
//   - timeline: a RectangleMark per stretch of a stage, one lane per stage.
// Scrubbing is Swift Charts' x selection: the x under the finger maps back to
// a slot, and React dims the other marks and moves the selection rule.
import { useEffect, useRef, useState } from "react";
import {
  Chart as SwiftChart, BarMark, LineMark, PointMark, RuleMark, RectangleMark, HStack, Text, Circle,
  withAnimation, type ChartAxis, type Color, type Fill,
} from "swiftjsx";
import type { ChartData } from "./model";

export type ChartProps = {
  data: ChartData;
  height?: number;
  /** The selected slot (scrubbing), or null. */
  selected?: number | null;
  onSelect?: (index: number | null) => void;
  /** Y-axis label format, as for `ChartAxis`: "compact" (2.5K), "{} hr". */
  yFormat?: string;
  showYAxis?: boolean;
  /** Bars grow from zero the first time the chart is shown. */
  animateOnAppear?: boolean;
  accessibilityLabel?: string;
  accessibilityIdentifier?: string;
};

/** Round numbers for an axis: 0, 2.5K, 5K, 7.5K, 10K. */
function niceScale(lo: number, hi: number, target = 4) {
  if (!(hi > lo)) hi = lo + 1;
  const raw = (hi - lo) / target;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw) ?? magnitude * 10;
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return { start, end, ticks };
}

function scaleFor(data: ChartData) {
  const values = data.points.filter((p) => !p.empty);
  switch (data.kind) {
    case "range": {
      const lo = Math.min(...values.map((p) => p.min ?? p.value));
      const hi = Math.max(...values.map((p) => p.max ?? p.value));
      return niceScale(data.yFloor ?? Math.max(0, lo - 5), hi + 5);
    }
    case "line": {
      const lo = Math.min(...values.map((p) => p.value));
      const hi = Math.max(...values.map((p) => p.value));
      return niceScale(data.yFloor ?? Math.max(0, lo - 5), hi + 5);
    }
    case "stacked": {
      const hi = Math.max(data.goal ?? 0, ...values.map((p) => (p.parts ?? []).reduce((a, b) => a + b, 0)));
      return niceScale(0, hi);
    }
    case "timeline": {
      const lanes = data.lanes?.length ?? 1;
      return { start: 0, end: lanes, ticks: [] };
    }
    default:
      return niceScale(0, Math.max(data.goal ?? 0, 1, ...values.map((p) => p.value)));
  }
}

/** The slot under a selected x (dates come as ms). */
function slotAt(data: ChartData, x: string | number): number | null {
  const points = data.points;
  if (!points.length || typeof x !== "number") return null;
  // Numbers are where the points are, and dates come back as the start of
  // the day / week / hour under the finger (the bar's own date, within a
  // day of ours for weeks, whose first weekday depends on the locale): the
  // nearest point either way.
  let best = 0;
  points.forEach((p, i) => {
    if (Math.abs(+p.x - x) < Math.abs(+points[best].x - x)) best = i;
  });
  return best;
}

/** Runs of consecutive line segments with the same color (a segment takes its start point's). */
function colorRuns(data: ChartData) {
  const runs: { color: Color; from: number; to: number }[] = [];
  for (let i = 0; i + 1 < data.points.length; i++) {
    const color = data.pointColors?.[i] ?? data.color;
    const run = runs[runs.length - 1];
    if (run && run.color === color && run.to === i) run.to = i + 1;
    else runs.push({ color, from: i, to: i + 1 });
  }
  return runs;
}

export function Chart({
  data,
  height = 200,
  selected = null,
  onSelect,
  yFormat = "compact",
  showYAxis = true,
  animateOnAppear = false,
  accessibilityLabel,
  accessibilityIdentifier,
}: ChartProps) {
  const [grown, setGrown] = useState(!animateOnAppear);
  const growth = grown ? 1 : 0;

  // Grow the bars once they've been drawn empty (a separate commit, so
  // SwiftUI has something to animate from).
  useEffect(() => {
    if (grown) return;
    const timer = setTimeout(() => withAnimation({ type: "spring", duration: 0.7, bounce: 0.15 }, () => setGrown(true)), 60);
    return () => clearTimeout(timer);
  }, [grown]);

  // Swift Charts reports every x the finger crosses: tell the parent only
  // when the slot changes.
  const current = useRef<number | null>(null);
  useEffect(() => {
    if (selected === null) current.current = null;
  }, [selected]);
  const onXSelectionChange = onSelect
    ? (x: string | number | null) => {
        const i = x === null ? null : slotAt(data, x);
        if (i === current.current) return;
        current.current = i;
        onSelect(i);
      }
    : undefined;

  const { start, end, ticks } = scaleFor(data);
  const timeline = data.kind === "timeline";
  // Timeline lanes are named on the y axis, at each lane's middle.
  const lanes = data.lanes ?? [];
  const yAxis: ChartAxis | "hidden" = timeline
    ? { values: lanes.map((lane, l) => ({ value: lanes.length - l - 0.5, label: lane.name })), gridlines: false, ticks: false, position: "leading" }
    : { values: ticks, format: yFormat, labels: showYAxis };
  const xAxis: ChartAxis = data.ticks ? { values: data.ticks, format: data.tickFormat } : { format: data.tickFormat };

  const point = selected === null ? null : data.points[selected];
  const marker = point && !point.empty && (data.kind === "line" || (data.kind === "range" && data.line));

  return (
    <SwiftChart
      frame={{ height }}
      xDomain={data.xDomain}
      yDomain={[start, end]}
      xAxis={xAxis}
      yAxis={yAxis}
      legend="hidden"
      onXSelectionChange={onXSelectionChange}
      accessibilityElement="ignore"
      accessibilityLabel={accessibilityLabel}
      accessibilityIdentifier={accessibilityIdentifier}
    >
      {marks(data, selected, growth)}

      {data.goal !== undefined ? <RuleMark key="goal" y={data.goal} foregroundStyle="secondaryLabel" lineWidth={1} dash={[4, 3]} /> : null}

      {point ? <RuleMark key="selection" x={point.x} xUnit={data.unit} foregroundStyle="secondaryLabel" lineWidth={1.5} /> : null}

      {/* The selected value on line and range charts: a white dot in a ring. */}
      {marker ? <PointMark key="marker-dot" x={point.x} xUnit={data.unit} y={point.value} foregroundStyle="white" symbolSize={150} /> : null}
      {marker ? <PointMark key="marker-ring" x={point.x} xUnit={data.unit} y={point.value} foregroundStyle={data.pointColors?.[selected!] ?? data.color} symbolSize={196} symbolStroke={3} /> : null}
    </SwiftChart>
  );
}

function marks(data: ChartData, selected: number | null, growth: number) {
  const dimmed = (i: number) => selected !== null && selected !== i;
  const count = data.points.length;
  const unit = data.unit;

  switch (data.kind) {
    case "bars": {
      const radius = count <= 12 ? 4 : 2;
      const ratio = count <= 7 ? 0.56 : count <= 12 ? 0.62 : 0.7;
      return data.points.map((p, i) => (
        <BarMark
          key={`bar${i}`}
          x={p.x}
          xUnit={unit}
          y={p.empty ? 0 : p.value * growth}
          foregroundStyle={data.color}
          opacity={dimmed(i) ? 0.3 : 1}
          cornerRadius={radius}
          barWidthRatio={ratio}
        />
      ));
    }

    case "stacked": {
      const ratio = count <= 7 ? 0.56 : count <= 12 ? 0.62 : 0.7;
      // Marks at the same x stack in order: the first part at the bottom.
      return data.points.flatMap((p, i) =>
        (p.parts ?? []).map((part, k) => (
          <BarMark
            key={`bar${i}-${k}`}
            x={p.x}
            xUnit={unit}
            y={part * growth}
            foregroundStyle={data.partColors?.[k] ?? data.color}
            opacity={dimmed(i) ? 0.3 : 1}
            barWidthRatio={ratio}
          />
        )),
      );
    }

    case "range": {
      const width = count <= 7 ? 9 : 6;
      const shown = data.points.map((p, i) => ({ p, i })).filter(({ p }) => !p.empty);
      return [
        ...data.points.map((p, i) =>
          p.empty ? (
            // Nothing to draw, but the slot keeps its place on the axis.
            <RuleMark key={`range${i}`} x={p.x} xUnit={unit} foregroundStyle="clear" />
          ) : (
            <BarMark
              key={`range${i}`}
              x={p.x}
              xUnit={unit}
              yStart={p.min ?? p.value}
              yEnd={p.max ?? p.value}
              barWidth={width}
              cornerRadius={width / 2}
              foregroundStyle={data.color}
              opacity={dimmed(i) ? 0.2 : data.line ? 0.38 : 1}
            />
          ),
        ),
        ...(data.line
          ? shown.map(({ p, i }) => <LineMark key={`avg${i}`} x={p.x} xUnit={unit} y={p.value} foregroundStyle={data.color} lineWidth={2} />)
          : []),
        ...(data.line && count <= 31
          ? shown.map(({ p, i }) => <PointMark key={`dot${i}`} x={p.x} xUnit={unit} y={p.value} foregroundStyle={data.color} symbolSize={25} />)
          : []),
      ];
    }

    case "line":
      // One series per color run, sharing its end point with the next run.
      return colorRuns(data).flatMap((run, r) =>
        data.points.slice(run.from, run.to + 1).map((p, k) => (
          <LineMark key={`line${r}-${k}`} x={p.x} xUnit={unit} y={p.value} series={`run${r}`} foregroundStyle={run.color} lineWidth={2.5} />
        )),
      );

    case "timeline": {
      const lanes = data.lanes ?? [];
      const n = lanes.length;
      // Lanes top to bottom: lane l spans y from n - l - 1 to n - l.
      return [
        ...lanes.map((_, l) => <RuleMark key={`lane${l}`} y={n - l} foregroundStyle="separator" lineWidth={0.5} />),
        ...lanes.flatMap((lane, l) =>
          lane.bars.map((bar, b) => (
            <RectangleMark
              key={`${l}-${b}`}
              xStart={bar.from}
              xEnd={bar.to}
              yStart={n - l - 0.81}
              yEnd={n - l - 0.19}
              cornerRadius={3}
              foregroundStyle={lane.color}
            />
          )),
        ),
      ];
    }
  }
}

/** A small fixed-size trend line, ending in a dot. */
export function Sparkline({ values, color, width = 96, height = 34 }: { values: number[]; color: Color; width?: number; height?: number }) {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = (hi - lo || 1) * 0.15;
  const last = values.length - 1;
  return (
    <SwiftChart
      frame={{ width, height }}
      xDomain={[-0.6, last + 0.6]}
      yDomain={[lo - pad, hi + pad]}
      xAxis="hidden"
      yAxis="hidden"
      legend="hidden"
      accessibilityHidden
    >
      {values.map((v, i) => (
        <LineMark key={i} x={i} y={v} foregroundStyle={color} lineWidth={2} />
      ))}
      <PointMark key="ring" x={last} y={values[last]} foregroundStyle="secondarySystemGroupedBackground" symbolSize={121} />
      <PointMark key="dot" x={last} y={values[last]} foregroundStyle={color} symbolSize={49} />
    </SwiftChart>
  );
}

/** Legend chips: a colored dot and a name. */
export function Legend({ items }: { items: { name: string; color: Fill }[] }) {
  return (
    <HStack spacing={14}>
      {items.map((item) => (
        <HStack key={item.name} spacing={5}>
          <Circle fill={item.color} frame={{ width: 8, height: 8 }} />
          <Text font="caption" foregroundStyle="secondary">{item.name}</Text>
        </HStack>
      ))}
    </HStack>
  );
}
