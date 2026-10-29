// Habit colors (stored as "#rrggbb", so a custom ColorPicker color works the
// same as a preset; "#rrggbb/30" is 30% opacity), icons, and the shades the
// calendar and heatmap use.
import type { Color } from "swiftjsx";

export type Hex = `#${string}`;

/** iOS system colors (light-mode values), so presets look native. */
export const PALETTE: { name: string; hex: Hex }[] = [
  { name: "Red", hex: "#FF3B30" },
  { name: "Orange", hex: "#FF9500" },
  { name: "Yellow", hex: "#FFCC00" },
  { name: "Green", hex: "#34C759" },
  { name: "Mint", hex: "#00C7BE" },
  { name: "Teal", hex: "#30B0C7" },
  { name: "Cyan", hex: "#32ADE6" },
  { name: "Blue", hex: "#007AFF" },
  { name: "Indigo", hex: "#5856D6" },
  { name: "Purple", hex: "#AF52DE" },
  { name: "Pink", hex: "#FF2D55" },
  { name: "Brown", hex: "#A2845E" },
];

export const ICONS = [
  "checkmark", "drop.fill", "book.fill", "figure.run", "figure.walk", "dumbbell.fill",
  "bicycle", "figure.yoga", "brain.head.profile", "bed.double.fill", "moon.zzz.fill", "sun.max.fill",
  "leaf.fill", "carrot.fill", "fork.knife", "cup.and.saucer.fill", "pills.fill", "heart.fill",
  "music.note", "guitars.fill", "paintbrush.fill", "pencil", "laptopcomputer", "graduationcap.fill",
  "globe", "dollarsign.circle.fill", "phone.down.fill", "nosign", "pawprint.fill", "house.fill",
  "sparkles", "flame.fill", "hand.raised.fill", "face.smiling", "camera.fill", "tree.fill",
];

/** "#rgb" / "#rrggbb" / "#rrggbbaa" → "#rrggbb" (lowercase). */
export function normalizeHex(hex: string): Hex {
  let h = hex.replace("#", "").toLowerCase();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}/.test(h)) return "#8e8e93";
  return `#${h.slice(0, 6)}`;
}

/** Whether white text reads well on the color (relative luminance). */
export function prefersDarkText(hex: Hex): boolean {
  const h = normalizeHex(hex).slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55;
}

export const paletteName = (hex: Hex) => PALETTE.find((p) => normalizeHex(p.hex) === normalizeHex(hex))?.name ?? "Custom";

/** Heatmap shade for a fraction of the day's target (0 = nothing logged). */
export function shade(hex: Hex, fraction: number): Color {
  if (fraction <= 0) return "quaternarySystemFill" as Color;
  if (fraction >= 1) return hex;
  return `${hex}/${Math.round((0.25 + 0.5 * fraction) * 100)}`;
}
