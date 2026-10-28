// The classic 2048 look (Gabriele Cirulli's original palette), with darker
// surroundings in dark mode. Tiles keep their colors in both.
import type { AnimationSpec, Color, ColorValue } from "swiftjsx";

export const palette = {
  page: { light: "#FAF8EF", dark: "#1C1A17" },
  board: { light: "#BBADA0", dark: "#3A332C" },
  cell: { light: "#CDC1B4", dark: "#4A423A" },
  text: { light: "#776E65", dark: "#E6DDD1" },
  subtext: { light: "#9C8F83", dark: "#A89C8F" },
  scoreBox: { light: "#BBADA0", dark: "#3A332C" },
  scoreLabel: { light: "#EEE4DA", dark: "#CDC1B4" },
  button: "#8F7A66",
  buttonPressed: "#7F6A56",
  buttonText: "#F9F6F2",
  gain: { light: "#776E65E6", dark: "#EDC22EE6" },
} satisfies Record<string, ColorValue>;

type TileStyle = { background: Color; foreground: Color; glow: number };

const DARK_TEXT: Color = "#776E65";
const LIGHT_TEXT: Color = "#F9F6F2";

const tiles: Record<number, TileStyle> = {
  2: { background: "#EEE4DA", foreground: DARK_TEXT, glow: 0 },
  4: { background: "#EDE0C8", foreground: DARK_TEXT, glow: 0 },
  8: { background: "#F2B179", foreground: LIGHT_TEXT, glow: 0 },
  16: { background: "#F59563", foreground: LIGHT_TEXT, glow: 0 },
  32: { background: "#F67C5F", foreground: LIGHT_TEXT, glow: 0 },
  64: { background: "#F65E3B", foreground: LIGHT_TEXT, glow: 0 },
  128: { background: "#EDCF72", foreground: LIGHT_TEXT, glow: 0.2 },
  256: { background: "#EDCC61", foreground: LIGHT_TEXT, glow: 0.3 },
  512: { background: "#EDC850", foreground: LIGHT_TEXT, glow: 0.4 },
  1024: { background: "#EDC53F", foreground: LIGHT_TEXT, glow: 0.5 },
  2048: { background: "#EDC22E", foreground: LIGHT_TEXT, glow: 0.6 },
};
const SUPER: TileStyle = { background: "#3C3A32", foreground: LIGHT_TEXT, glow: 0 };

export const tileStyle = (value: number): TileStyle => tiles[value] ?? SUPER;

/** Font size for a tile's number: smaller as it gets more digits (55 / 45 / 35 / 30 px at 107 px in the original). */
export function tileFontSize(value: number, cell: number): number {
  const digits = String(value).length;
  const ratio = digits <= 2 ? 0.5 : digits === 3 ? 0.42 : digits === 4 ? 0.33 : digits === 5 ? 0.27 : 0.22;
  return Math.max(9, Math.round(cell * ratio));
}

/** Board geometry for a square `side` points wide with `size` × `size` cells. */
export function boardGeometry(side: number, size: number) {
  const gap = side * (size <= 4 ? 0.03 : size === 5 ? 0.026 : 0.022);
  const cell = Math.max(0, (side - gap * (size + 1)) / size);
  return {
    gap,
    cell,
    radius: Math.max(3, cell * 0.07),
    /** Top-leading corner of row/column `i`. */
    origin: (i: number) => gap + i * (cell + gap),
  };
}
export type BoardGeometry = ReturnType<typeof boardGeometry>;

// MARK: Motion (seconds). Close to the original: 100 ms slides, then the
// new tiles appear and merged tiles pop.

/** Tiles sliding to their new cells. A spring, so a swipe mid-slide retargets smoothly. */
export const SLIDE: AnimationSpec = { type: "spring", duration: 0.14, bounce: 0 };
/** When the ghosts of a merge are dropped (after the slide). Milliseconds. */
export const SETTLE_MS = 150;
/** Milliseconds between a tile's frame and its face going in (see Board.tsx). */
export const FACE_DELAY_MS = 30;
/** A spawned tile fading and growing in, after the slide (counting FACE_DELAY_MS). */
export const APPEAR: AnimationSpec = { type: "easeOut", duration: 0.2, delay: 0.07 };
/** A merged tile growing in past full size and settling back: the "pop". */
export const POP: AnimationSpec = { type: "spring", duration: 0.28, bounce: 0.5, delay: 0.05 };
/** Tiles leaving (ghosts under their merged tile, a finished game's tiles). */
export const VANISH: AnimationSpec = { type: "easeOut", duration: 0.15 };
/** Win / game over cards, after a beat. */
export const OVERLAY: AnimationSpec = { type: "easeInOut", duration: 0.35, delay: 0.25 };
