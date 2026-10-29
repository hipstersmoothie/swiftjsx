import type { Color } from "swiftjsx";
import type { Stage, WorkoutType } from "./data";

/** The activity ring colors: start and end of each ring's gradient, and its track. */
export const RINGS = {
  move: { from: "#E3005A" as Color, to: "#FF3B7F" as Color, track: "#FA114F33" as Color, label: "#FA114F" as Color },
  exercise: { from: "#7BE000" as Color, to: "#C2FF3D" as Color, track: "#92E82A33" as Color, label: "#A2F03A" as Color },
  stand: { from: "#00C8E8" as Color, to: "#5CFFF3" as Color, track: "#1EEAEF33" as Color, label: "#1EEAEF" as Color },
};

export const STAGE_COLORS: Record<Stage, Color> = {
  awake: "#FF7A5C",
  rem: "#5AC8FA",
  core: "#3A82F7",
  deep: "#3634A3",
};

export const STAGE_NAMES: Record<Stage, string> = { awake: "Awake", rem: "REM", core: "Core", deep: "Deep" };

// Hex, so `${color}/18` (18% opacity) is still a Color.
export const WORKOUTS: Record<WorkoutType, { name: string; icon: string; color: `#${string}` }> = {
  run: { name: "Outdoor Run", icon: "figure.run", color: "#A6FF00" },
  walk: { name: "Outdoor Walk", icon: "figure.walk", color: "#FFD60A" },
  cycle: { name: "Outdoor Cycle", icon: "figure.outdoor.cycle", color: "#64D2FF" },
  strength: { name: "Strength Training", icon: "figure.strengthtraining.traditional", color: "#FF9F0A" },
  yoga: { name: "Yoga", icon: "figure.yoga", color: "#BF5AF2" },
  hiit: { name: "HIIT", icon: "figure.highintensity.intervaltraining", color: "#FF375F" },
  swim: { name: "Pool Swim", icon: "figure.pool.swim", color: "#0A84FF" },
};

/** Heart-rate zones as fractions of max heart rate (190 for the demo user). */
export const MAX_HR = 190;
export const ZONES: { name: string; from: number; color: Color }[] = [
  { name: "Zone 1", from: 0, color: "#5AC8FA" },
  { name: "Zone 2", from: 0.6, color: "#30D158" },
  { name: "Zone 3", from: 0.7, color: "#FFD60A" },
  { name: "Zone 4", from: 0.8, color: "#FF9F0A" },
  { name: "Zone 5", from: 0.9, color: "#FF375F" },
];

export function zoneOf(bpm: number) {
  let zone = 0;
  ZONES.forEach((z, i) => {
    if (bpm >= z.from * MAX_HR) zone = i;
  });
  return zone;
}
