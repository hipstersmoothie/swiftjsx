// Charts from plain views. There's no Path, Canvas, GeometryReader or Swift
// Charts here, so:
//   - the plot's width comes from `onLayout` (and its window position from
//     `measure()`, because drag locations are in window coordinates);
//   - every mark is a shape with a frame and an offset in points;
//   - a line is a chain of thin rotated capsules, one per segment;
//   - an area/band is drawn as per-slot capsules (no filled polygon).
// Scrubbing runs on the main thread: a worklet maps the finger to a slot and
// moves the selection rule in the same frame, and tells React (runOnJS) only
// when the slot changes, to update the header and dim the other marks.
import { useEffect, useRef, useState } from "react";
import {
  ZStack, VStack, HStack, Text, Rectangle, RoundedRectangle, Capsule, Circle, Spacer,
  useSharedValue, useAnimatedStyle, withAnimation, runOnJS, HostInstance, type Color, type Fill,
} from "swiftjsx";
import type { ChartData } from "./model";
import { compact } from "./format";

const Y_AXIS = 38;
const X_AXIS = 18;

type Point = { x: number; y: number };

export type ChartProps = {
  data: ChartData;
  height?: number;
  /** The selected slot (scrubbing), or null. */
  selected?: number | null;
  onSelect?: (index: number | null) => void;
  /** Y-axis tick labels. */
  yLabel?: (v: number) => string;
  showYAxis?: boolean;
  /** Bars grow from zero the first time the chart is shown. */
  animateOnAppear?: boolean;
  accessibilityLabel?: string;
  accessibilityIdentifier?: string;
};

/** Round numbers for an axis: 0, 2.5K, 5K, 7.5K, 10K. */
export function niceScale(lo: number, hi: number, target = 4) {
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
    case "timeline":
      return { start: 0, end: 1, ticks: [] };
    default:
      return niceScale(0, Math.max(data.goal ?? 0, 1, ...values.map((p) => p.value)));
  }
}

export function Chart({
  data,
  height = 200,
  selected = null,
  onSelect,
  yLabel = compact,
  showYAxis = true,
  animateOnAppear = false,
  accessibilityLabel,
  accessibilityIdentifier,
}: ChartProps) {
  const plot = useRef<HostInstance>(null);
  const [width, setWidth] = useState(0);
  const [originX, setOriginX] = useState(0);
  const [grown, setGrown] = useState(!animateOnAppear);

  const count = Math.max(data.points.length, 1);
  const slot = width / count;
  const { start, end, ticks } = scaleFor(data);
  const y = (v: number) => height - ((v - start) / (end - start || 1)) * height;
  const growth = grown ? 1 : 0;

  // Drag locations are in window coordinates: keep the plot's window x.
  const remeasure = () => {
    plot.current?.measure().then((f) => setOriginX((x) => (Math.abs(x - f.x) > 0.5 ? f.x : x)));
  };

  // Grow the bars once they've been drawn empty (a separate commit, so
  // SwiftUI has something to animate from).
  useEffect(() => {
    if (!width || grown) return;
    const timer = setTimeout(() => withAnimation({ type: "spring", duration: 0.7, bounce: 0.15 }, () => setGrown(true)), 60);
    return () => clearTimeout(timer);
  }, [width, grown]);

  // Selection: worklets move the rule; React hears about slot changes.
  const scrubX = useSharedValue(-1);
  const current = useSharedValue(-1);
  const rule = useAnimatedStyle(() => ({ offset: { x: scrubX.get() - 0.75 }, opacity: scrubX.get() < 0 ? 0 : 1 }));
  const select = (i: number) => onSelect?.(i < 0 ? null : i);
  const interactive = !!onSelect && width > 0;

  const dimmed = (i: number) => selected !== null && selected !== i;
  const barWidth = Math.max(1, slot * (count <= 7 ? 0.56 : count <= 12 ? 0.62 : 0.7));
  const inset = (slot - barWidth) / 2;
  const center = (i: number) => i * slot + slot / 2;

  return (
    <VStack spacing={0} accessibilityElement="ignore" accessibilityLabel={accessibilityLabel} accessibilityIdentifier={accessibilityIdentifier}>
      <HStack spacing={0} alignment="top">
        <ZStack
          ref={plot}
          alignment="topLeading"
          frame={{ maxWidth: "infinity", height }}
          contentShape="rectangle"
          onLayout={(size) => {
            setWidth(size.width);
            remeasure();
          }}
          onAppear={() => {
            // Again once a push transition has settled.
            setTimeout(remeasure, 600);
          }}
          onDrag={
            interactive
              ? (e) => {
                  "worklet";
                  const i = Math.max(0, Math.min(count - 1, Math.floor((e.location.x - originX) / slot)));
                  scrubX.set(i * slot + slot / 2);
                  if (i !== current.get()) {
                    current.set(i);
                    runOnJS(select)(i);
                  }
                }
              : undefined
          }
          onDragEnd={
            interactive
              ? () => {
                  "worklet";
                  scrubX.set(-1);
                  current.set(-1);
                  runOnJS(select)(-1);
                  runOnJS(remeasure)();
                }
              : undefined
          }
        >
          {/* Gridlines */}
          {data.kind === "timeline"
            ? (data.lanes ?? []).map((_, lane) => (
                <Rectangle key={`lane${lane}`} fill="separator" frame={{ width, height: 0.5 }} offset={{ y: (lane * height) / (data.lanes?.length ?? 1) }} />
              ))
            : ticks.map((t) => <Rectangle key={`grid${t}`} fill="separator" frame={{ width, height: 0.5 }} offset={{ y: y(t) }} animation="smooth" />)}
          {data.points.map((p, i) =>
            p.axis ? <Rectangle key={`tick${i}`} fill="separator" frame={{ width: 0.5, height }} offset={{ x: i * slot }} transition="opacity" /> : null,
          )}

          {width > 0 ? <Marks data={data} slot={slot} barWidth={barWidth} inset={inset} height={height} y={y} growth={growth} dimmed={dimmed} center={center} /> : null}

          {/*
            Goal: a dashed rule. There's no line shape, so it's a 1-pt-tall
            rectangle's outline, trimmed to its first half (the top edge): the
            whole outline would run the dashes there and back, out of phase.
          */}
          {data.goal !== undefined && width > 0 ? (
            <Rectangle stroke="secondaryLabel" lineWidth={1} dash={[4, 3]} trim={[0, 0.5]} frame={{ width, height: 1 }} offset={{ y: y(data.goal) }} animation="smooth" />
          ) : null}

          {/* The selection rule, moved by the worklet. */}
          <Rectangle fill="secondaryLabel" frame={{ width: 1.5, height }} animatedStyle={rule} />

          {/* Point marker on the selected value of line and range charts. */}
          {selected !== null && (data.kind === "line" || (data.kind === "range" && data.line)) && !data.points[selected]?.empty ? (
            <Circle
              fill="white"
              stroke={data.pointColors?.[selected] ?? data.color}
              lineWidth={3}
              frame={{ width: 12, height: 12 }}
              offset={{ x: center(selected) - 6, y: y(data.points[selected].value) - 6 }}
              shadow={{ radius: 2, color: "#00000040" }}
            />
          ) : null}
        </ZStack>

        {showYAxis ? (
          <ZStack alignment="topLeading" frame={{ width: Y_AXIS, height }} accessibilityHidden>
            {data.kind === "timeline"
              ? (data.lanes ?? []).map((lane, i) => (
                  <Text key={lane.name} font="caption2" fontWeight="medium" foregroundStyle={lane.color} lineLimit={1} offset={{ x: 6, y: ((i + 0.5) * height) / (data.lanes?.length ?? 1) - 7 }}>
                    {lane.name}
                  </Text>
                ))
              : ticks.map((t) => (
                  <Text key={t} font="caption2" foregroundStyle="secondary" monospacedDigit lineLimit={1} offset={{ x: 6, y: Math.min(y(t) - 7, height - 12) }} animation="smooth">
                    {yLabel(t)}
                  </Text>
                ))}
          </ZStack>
        ) : null}
      </HStack>

      {/* X-axis labels, at the leading edge of their slot. */}
      <HStack spacing={0}>
        <ZStack alignment="topLeading" frame={{ maxWidth: "infinity", height: X_AXIS }} accessibilityHidden>
          {width > 0
            ? data.points.map((p, i) =>
                p.axis ? (
                  <Text key={`x${i}`} font="caption2" foregroundStyle="secondary" lineLimit={1} offset={{ x: i * slot + 3, y: 4 }} transition="opacity">
                    {p.axis}
                  </Text>
                ) : null,
              )
            : null}
        </ZStack>
        {showYAxis ? <Spacer frame={{ width: Y_AXIS }} /> : null}
      </HStack>
    </VStack>
  );
}

type MarksProps = {
  data: ChartData;
  slot: number;
  barWidth: number;
  inset: number;
  height: number;
  y: (v: number) => number;
  growth: number;
  dimmed: (i: number) => boolean;
  center: (i: number) => number;
};

function Marks({ data, slot, barWidth, inset, height, y, growth, dimmed, center }: MarksProps) {
  const radius = Math.min(4, barWidth / 2);
  const top = { topLeading: radius, topTrailing: radius };

  switch (data.kind) {
    case "bars":
      return (
        <>
          {data.points.map((p, i) => {
            const h = p.value > 0 ? Math.max(2, (height - y(p.value)) * growth) : 0;
            return (
              <RoundedRectangle
                key={i}
                cornerRadius={top}
                fill={data.color}
                frame={{ width: barWidth, height: h }}
                offset={{ x: i * slot + inset, y: height - h }}
                opacity={dimmed(i) ? 0.3 : 1}
                transition="opacity"
              />
            );
          })}
        </>
      );

    case "stacked":
      return (
        <>
          {data.points.map((p, i) => {
            const parts = p.parts ?? [];
            const total = parts.reduce((a, b) => a + b, 0);
            const h = (height - y(total)) * growth;
            return (
              <VStack
                key={i}
                spacing={0}
                frame={{ width: barWidth, height: h }}
                offset={{ x: i * slot + inset, y: height - h }}
                cornerRadius={top}
                opacity={dimmed(i) ? 0.3 : 1}
                transition="opacity"
              >
                {/* Top to bottom: the last part first. */}
                {parts
                  .map((part, k) => ({ part, k }))
                  .reverse()
                  .map(({ part, k }) => (
                    <Rectangle key={k} fill={data.partColors?.[k] ?? data.color} frame={{ width: barWidth, height: total ? (part / total) * h : 0 }} />
                  ))}
              </VStack>
            );
          })}
        </>
      );

    case "range": {
      const capsule = Math.min(barWidth, 9);
      const points = data.points.map((p, i) => ({ x: center(i), y: y(p.value), empty: p.empty }));
      return (
        <>
          {data.points.map((p, i) => {
            if (p.empty) return null;
            const top = y(p.max ?? p.value);
            const h = Math.max(capsule, (y(p.min ?? p.value) - top) * growth);
            return (
              <Capsule
                key={i}
                fill={data.color}
                frame={{ width: capsule, height: h }}
                offset={{ x: center(i) - capsule / 2, y: top }}
                opacity={dimmed(i) ? 0.2 : data.line ? 0.38 : 1}
                transition="opacity"
              />
            );
          })}
          {data.line ? <Polyline points={points} color={data.color} lineWidth={2} dots={data.points.length <= 31} /> : null}
        </>
      );
    }

    case "line": {
      const points = data.points.map((p, i) => ({ x: center(i), y: y(p.value), empty: p.empty }));
      return <Polyline points={points} color={data.color} colors={data.pointColors} lineWidth={2.5} />;
    }

    case "timeline": {
      const lanes = data.lanes ?? [];
      const laneHeight = height / Math.max(lanes.length, 1);
      return (
        <>
          {lanes.flatMap((lane, l) =>
            lane.bars.map((bar, b) => (
              <RoundedRectangle
                key={`${l}-${b}`}
                cornerRadius={3}
                fill={lane.color}
                frame={{ width: Math.max(2, (bar.to - bar.from) * slot), height: laneHeight * 0.62 * Math.max(growth, 0.01) }}
                offset={{ x: bar.from * slot, y: l * laneHeight + laneHeight * 0.19 }}
              />
            )),
          )}
        </>
      );
    }
  }
}

/**
 * A line through points: one rotated capsule per segment (there's no Path).
 * Segments animate independently, so a changing line can come apart mid-flight.
 */
export function Polyline({
  points,
  color,
  colors,
  lineWidth = 2,
  dots = false,
}: {
  points: (Point & { empty?: boolean })[];
  color: Color;
  /** Per-point colors (a segment takes its start point's). */
  colors?: Color[];
  lineWidth?: number;
  dots?: boolean;
}) {
  return (
    <>
      {points.slice(1).map((b, i) => {
        const a = points[i];
        if (a.empty || b.empty) return null;
        return <Segment key={`s${i}`} a={a} b={b} color={colors?.[i] ?? color} width={lineWidth} />;
      })}
      {dots
        ? points.map((p, i) =>
            p.empty ? null : (
              <Circle key={`d${i}`} fill={colors?.[i] ?? color} frame={{ width: lineWidth * 2.6, height: lineWidth * 2.6 }} offset={{ x: p.x - lineWidth * 1.3, y: p.y - lineWidth * 1.3 }} />
            ),
          )
        : null}
    </>
  );
}

function Segment({ a, b, color, width }: { a: Point; b: Point; color: Fill; width: number }) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  // Overlap the round caps by the line width so joints look continuous.
  const length = Math.hypot(dx, dy) + width;
  return (
    <Capsule
      fill={color}
      frame={{ width: length, height: width }}
      // A view rotates around its center, and the offset applies after: put the
      // center at the segment's midpoint.
      offset={{ x: (a.x + b.x) / 2 - length / 2, y: (a.y + b.y) / 2 - width / 2 }}
      rotation={(Math.atan2(dy, dx) * 180) / Math.PI}
    />
  );
}

/** A small fixed-size trend line (no layout needed: the size is known). */
export function Sparkline({ values, color, width = 96, height = 34 }: { values: number[]; color: Color; width?: number; height?: number }) {
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = 3;
  const points = values.map((v, i) => ({
    x: pad + (i / Math.max(values.length - 1, 1)) * (width - pad * 2),
    y: pad + (1 - (v - lo) / (hi - lo || 1)) * (height - pad * 2),
  }));
  const last = points[points.length - 1];
  return (
    <ZStack alignment="topLeading" frame={{ width, height }} accessibilityHidden>
      <Polyline points={points} color={color} lineWidth={2} />
      <Circle fill={color} stroke="secondarySystemGroupedBackground" lineWidth={2} frame={{ width: 9, height: 9 }} offset={{ x: last.x - 4.5, y: last.y - 4.5 }} />
    </ZStack>
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
