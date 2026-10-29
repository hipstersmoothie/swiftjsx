// Apple-style activity rings: three concentric trimmed circles that fill on
// appear. Past 100% a ring laps itself: a second arc in the ring's end color
// draws over the first, and its tip casts a shadow so you can see the overlap.
import { useState } from "react";
import { ZStack, Circle, type Color, type Modifiers } from "swiftjsx";
import { RINGS } from "./theme";

type RingStyle = { from: Color; to: Color; track: Color };

export type RingsProps = Modifiers & {
  move: number;
  exercise: number;
  stand: number;
  /** Outer diameter in points. */
  size?: number;
  /** Fill from empty when first shown. */
  animateOnAppear?: boolean;
};

export function ActivityRings({ move, exercise, stand, size = 160, animateOnAppear = true, ...modifiers }: RingsProps) {
  // `initial` animates opacity, scale and offset in, not a trim: start empty,
  // and fill once the view is on screen (onAppear comes after SwiftUI has
  // drawn the empty rings, so the change animates; setting it in an effect
  // can land in the same frame).
  const [shown, setShown] = useState(!animateOnAppear);
  const lineWidth = Math.max(4, size * 0.12);
  const gap = Math.max(1, size * 0.012);
  const rings: [number, RingStyle][] = [
    [move, RINGS.move],
    [exercise, RINGS.exercise],
    [stand, RINGS.stand],
  ];

  return (
    <ZStack
      frame={{ width: size, height: size }}
      onAppear={() => setShown(true)}
      accessibilityElement="ignore"
      accessibilityLabel="Activity rings"
      accessibilityValue={`Move ${Math.round(move * 100)}%, Exercise ${Math.round(exercise * 100)}%, Stand ${Math.round(stand * 100)}%`}
      {...modifiers}
    >
      {rings.map(([progress, style], i) => (
        <Ring
          key={i}
          progress={shown ? progress : 0}
          diameter={size - i * 2 * (lineWidth + gap)}
          lineWidth={lineWidth}
          style={style}
          delay={i * 0.12}
          shadows={size >= 60}
        />
      ))}
    </ZStack>
  );
}

function Ring({ progress, diameter, lineWidth, style, delay, shadows }: { progress: number; diameter: number; lineWidth: number; style: RingStyle; delay: number; shadows: boolean }) {
  const first = Math.min(progress, 1);
  const lap = Math.max(0, Math.min(progress - 1, 1)); // a second lap at most
  // Each layer animates its own trim with the `animation` prop: the lap waits
  // for the first turn to finish.
  const fill = { type: "easeOut", duration: 0.9 * Math.max(first, 0.2), delay } as const;
  const lapAnimation = { type: "easeOut", duration: 0.7 * Math.max(lap, 0.2), delay: delay + fill.duration } as const;
  const radius = diameter / 2 - lineWidth / 2;
  const frame = { width: diameter, height: diameter };

  return (
    <ZStack frame={frame}>
      <Circle stroke={style.track} lineWidth={lineWidth} frame={frame} />
      <Circle
        stroke={{ gradient: [style.from, style.to], type: "angular" }}
        lineWidth={lineWidth}
        trim={[0, Math.max(first, 0.0001)]}
        rotation={-90}
        frame={frame}
        opacity={progress > 0 ? 1 : 0}
        animation={fill}
      />
      {/*
        The lap is always there (empty and hidden below 100%), so filling it
        animates instead of inserting an already-full arc.
        Its tip: a dot at the top of a full-size layer that rotates with the
        arc, so it follows the arc's end while animating. The arc's round cap
        covers the dot, and the dot's shadow falls ahead, onto the first lap.
      */}
      {shadows ? (
        <ZStack frame={frame} rotation={lap * 360} opacity={lap > 0 ? 1 : 0} animation={lapAnimation}>
          <Circle
            fill={style.to}
            frame={{ width: lineWidth, height: lineWidth }}
            offset={{ y: -radius }}
            shadow={{ radius: lineWidth * 0.18, x: lineWidth * 0.12, color: "#000000aa" }}
          />
        </ZStack>
      ) : null}
      <Circle
        stroke={style.to}
        lineWidth={lineWidth}
        trim={[0, Math.max(lap, 0.0001)]}
        rotation={-90}
        frame={frame}
        opacity={lap > 0 ? 1 : 0}
        animation={lapAnimation}
      />
    </ZStack>
  );
}

/** The ring colors and labels, for legends. */
export const RING_LABELS = [
  { key: "move", title: "Move", color: RINGS.move.label, unit: "CAL" },
  { key: "exercise", title: "Exercise", color: RINGS.exercise.label, unit: "MIN" },
  { key: "stand", title: "Stand", color: RINGS.stand.label, unit: "HRS" },
] as const;
