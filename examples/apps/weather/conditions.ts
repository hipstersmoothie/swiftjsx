// WMO weather codes (https://open-meteo.com/en/docs#weathervariables) as
// labels, SF Symbols and background gradients.
import type { Color } from "swiftjsx";

type Kind = "clear" | "cloudy" | "fog" | "rain" | "snow" | "storm";
type Condition = { label: string; kind: Kind; day: string; night: string };

const conditions: Record<number, Condition> = {
  0: { label: "Clear", kind: "clear", day: "sun.max.fill", night: "moon.stars.fill" },
  1: { label: "Mostly Clear", kind: "clear", day: "sun.max.fill", night: "moon.fill" },
  2: { label: "Partly Cloudy", kind: "clear", day: "cloud.sun.fill", night: "cloud.moon.fill" },
  3: { label: "Cloudy", kind: "cloudy", day: "cloud.fill", night: "cloud.fill" },
  45: { label: "Foggy", kind: "fog", day: "cloud.fog.fill", night: "cloud.fog.fill" },
  48: { label: "Freezing Fog", kind: "fog", day: "cloud.fog.fill", night: "cloud.fog.fill" },
  51: { label: "Light Drizzle", kind: "rain", day: "cloud.drizzle.fill", night: "cloud.drizzle.fill" },
  53: { label: "Drizzle", kind: "rain", day: "cloud.drizzle.fill", night: "cloud.drizzle.fill" },
  55: { label: "Heavy Drizzle", kind: "rain", day: "cloud.drizzle.fill", night: "cloud.drizzle.fill" },
  56: { label: "Freezing Drizzle", kind: "rain", day: "cloud.sleet.fill", night: "cloud.sleet.fill" },
  57: { label: "Freezing Drizzle", kind: "rain", day: "cloud.sleet.fill", night: "cloud.sleet.fill" },
  61: { label: "Light Rain", kind: "rain", day: "cloud.rain.fill", night: "cloud.rain.fill" },
  63: { label: "Rain", kind: "rain", day: "cloud.rain.fill", night: "cloud.rain.fill" },
  65: { label: "Heavy Rain", kind: "rain", day: "cloud.heavyrain.fill", night: "cloud.heavyrain.fill" },
  66: { label: "Freezing Rain", kind: "rain", day: "cloud.sleet.fill", night: "cloud.sleet.fill" },
  67: { label: "Freezing Rain", kind: "rain", day: "cloud.sleet.fill", night: "cloud.sleet.fill" },
  71: { label: "Light Snow", kind: "snow", day: "cloud.snow.fill", night: "cloud.snow.fill" },
  73: { label: "Snow", kind: "snow", day: "cloud.snow.fill", night: "cloud.snow.fill" },
  75: { label: "Heavy Snow", kind: "snow", day: "cloud.snow.fill", night: "cloud.snow.fill" },
  77: { label: "Snow Grains", kind: "snow", day: "cloud.snow.fill", night: "cloud.snow.fill" },
  80: { label: "Showers", kind: "rain", day: "cloud.sun.rain.fill", night: "cloud.moon.rain.fill" },
  81: { label: "Showers", kind: "rain", day: "cloud.sun.rain.fill", night: "cloud.moon.rain.fill" },
  82: { label: "Heavy Showers", kind: "rain", day: "cloud.heavyrain.fill", night: "cloud.heavyrain.fill" },
  85: { label: "Snow Showers", kind: "snow", day: "cloud.snow.fill", night: "cloud.snow.fill" },
  86: { label: "Snow Showers", kind: "snow", day: "cloud.snow.fill", night: "cloud.snow.fill" },
  95: { label: "Thunderstorms", kind: "storm", day: "cloud.bolt.rain.fill", night: "cloud.moon.bolt.fill" },
  96: { label: "Thunderstorms", kind: "storm", day: "cloud.bolt.rain.fill", night: "cloud.bolt.rain.fill" },
  99: { label: "Severe Storms", kind: "storm", day: "cloud.bolt.rain.fill", night: "cloud.bolt.rain.fill" },
};

const unknown: Condition = { label: "—", kind: "cloudy", day: "cloud.fill", night: "cloud.fill" };

export const conditionLabel = (code: number) => (conditions[code] ?? unknown).label;

export function conditionSymbol(code: number, isDay = true) {
  const condition = conditions[code] ?? unknown;
  return isDay ? condition.day : condition.night;
}

const gradients: Record<Kind, { day: Color[]; night: Color[] }> = {
  clear: { day: ["#2f6fc4", "#6aa8e8"], night: ["#0b1026", "#2b3a67"] },
  cloudy: { day: ["#56718f", "#8fa5bb"], night: ["#1c2533", "#424f62"] },
  fog: { day: ["#75828f", "#a7b1bb"], night: ["#2a3039", "#535b66"] },
  rain: { day: ["#3f5168", "#71849a"], night: ["#121a25", "#334255"] },
  snow: { day: ["#6782a0", "#a2b6ca"], night: ["#232c3b", "#4f5e74"] },
  storm: { day: ["#2b2d45", "#585d7a"], night: ["#13141f", "#363a52"] },
};

export function conditionGradient(code: number, isDay: boolean): Color[] {
  const { kind } = conditions[code] ?? unknown;
  return isDay ? gradients[kind].day : gradients[kind].night;
}

/** Colors for the 10-day temperature bars, cold to hot (°C). */
export function temperatureColor(celsius: number): Color {
  if (celsius < 0) return "#7ac8ff";
  if (celsius < 10) return "#5fd3c4";
  if (celsius < 18) return "#a6e05a";
  if (celsius < 25) return "#ffd23f";
  if (celsius < 32) return "#ff9f2e";
  return "#ff5a3c";
}
