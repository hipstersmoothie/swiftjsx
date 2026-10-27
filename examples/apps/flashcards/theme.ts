// Deck colors and icons.
import type { Color } from "swiftjsx";

export type Theme = { name: string; gradient: Color[]; tint: Color };

export const themes = {
  blue: { name: "Blue", gradient: ["#0A84FF", "#5E5CE6"], tint: "blue" },
  orange: { name: "Orange", gradient: ["#FF9F0A", "#FF375F"], tint: "orange" },
  green: { name: "Green", gradient: ["#30D158", "#0A9396"], tint: "green" },
  purple: { name: "Purple", gradient: ["#BF5AF2", "#5E5CE6"], tint: "purple" },
  pink: { name: "Pink", gradient: ["#FF375F", "#BF5AF2"], tint: "pink" },
  teal: { name: "Teal", gradient: ["#64D2FF", "#0A84FF"], tint: "teal" },
} satisfies Record<string, Theme>;

export type ThemeName = keyof typeof themes;
export const themeNames = Object.keys(themes) as ThemeName[];

/** Falls back for decks persisted with a theme that no longer exists. */
export const themeOf = (name: string): Theme => themes[name as ThemeName] ?? themes.blue;

export const symbols = [
  "character.book.closed.fill", "globe.americas.fill", "curlybraces", "atom",
  "music.note", "leaf.fill", "brain.head.profile", "flag.fill",
  "function", "paintpalette.fill", "stethoscope", "star.fill",
];
