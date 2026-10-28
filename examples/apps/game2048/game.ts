// The rules of 2048 as pure functions: (game, direction) → next game.
//
// Tiles keep their `id` for as long as they live, so the board can key its
// views by id and SwiftUI slides each one to its new cell. A merge doesn't
// reuse either tile: both slide into the cell and become `ghosts` (drawn under
// the result until the slide is over, then dropped by `settle`), and the
// result is a new tile with `origin: "merge"`, which pops in. Randomness comes
// from a seed stored in the game, so the same game and direction always give
// the same result (and undo + redo spawns the same tile).

export type Direction = "up" | "down" | "left" | "right";
export const DIRECTIONS: Direction[] = ["up", "down", "left", "right"];

export const WIN_VALUE = 2048;

export type Tile = {
  id: number;
  value: number;
  row: number;
  col: number;
  /** "spawn": a random new tile; "merge": made by merging two. Decides how it appears. */
  origin: "spawn" | "merge";
};

export type Game = {
  /** Unique per game, so a new game's tiles never reuse the old one's views. */
  id: string;
  size: number;
  /** Live tiles, sorted by id. */
  tiles: Tile[];
  /** Tiles consumed by merges in the last move, at the cell they merged into. */
  ghosts: Tile[];
  score: number;
  moves: number;
  nextId: number;
  seed: number;
  /** Reached 2048 (once per game; stays set after undo). */
  won: boolean;
  /** Chose to keep going after winning. */
  keepPlaying: boolean;
  /** No moves left. */
  over: boolean;
  /** Time played, committed on each move and when the clock pauses. */
  elapsedMs: number;
  createdAt: number;
};

export type MoveResult = {
  game: Game;
  moved: boolean;
  gained: number;
  merges: number;
  /** This move made the first 2048 of the game. */
  reachedWin: boolean;
  /** This move left no moves. */
  ended: boolean;
};

// MARK: Randomness (mulberry32: the seed is the whole state)

function random(seed: number): [value: number, seed: number] {
  const next = (seed + 0x6d2b79f5) | 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

/** Puts a 2 (90%) or a 4 in a random empty cell. */
function spawn(tiles: Tile[], size: number, id: number, seed: number): { tile: Tile | null; seed: number } {
  const taken = new Set(tiles.map((t) => t.row * size + t.col));
  const empty: number[] = [];
  for (let i = 0; i < size * size; i++) if (!taken.has(i)) empty.push(i);
  if (empty.length === 0) return { tile: null, seed };
  const [pick, s1] = random(seed);
  const [kind, s2] = random(s1);
  const cell = empty[Math.min(empty.length - 1, Math.floor(pick * empty.length))];
  return {
    tile: { id, value: kind < 0.9 ? 2 : 4, row: Math.floor(cell / size), col: cell % size, origin: "spawn" },
    seed: s2,
  };
}

// MARK: Games

export function newGame(size: number, id: string, seed: number, now: number): Game {
  let tiles: Tile[] = [];
  let nextId = 1;
  let state = seed | 0;
  for (let i = 0; i < 2; i++) {
    const { tile, seed: next } = spawn(tiles, size, nextId, state);
    state = next;
    if (tile) {
      tiles = [...tiles, tile];
      nextId++;
    }
  }
  return {
    id, size, tiles, ghosts: [], score: 0, moves: 0, nextId, seed: state,
    won: false, keepPlaying: false, over: false, elapsedMs: 0, createdAt: now,
  };
}

/** Whether any move would change the board. */
export function canMove(tiles: Tile[], size: number): boolean {
  if (tiles.length < size * size) return true;
  const grid = new Map(tiles.map((t) => [t.row * size + t.col, t.value]));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const v = grid.get(r * size + c);
      if (c + 1 < size && grid.get(r * size + c + 1) === v) return true;
      if (r + 1 < size && grid.get((r + 1) * size + c) === v) return true;
    }
  }
  return false;
}

/** The cell `k` steps from the edge the tiles move toward, in line `line`. */
function cellAt(direction: Direction, size: number, line: number, k: number): [row: number, col: number] {
  if (direction === "left") return [line, k];
  if (direction === "right") return [line, size - 1 - k];
  if (direction === "up") return [k, line];
  return [size - 1 - k, line];
}

const byId = (a: Tile, b: Tile) => a.id - b.id;

/**
 * Slides every tile toward `direction`, merging equal neighbors once per
 * move (the pair nearest the edge first: 2 2 2 → 4 2), then spawns a tile.
 * A move that changes nothing returns the same game with `moved: false`.
 */
export function move(game: Game, direction: Direction): MoveResult {
  const unchanged: MoveResult = { game, moved: false, gained: 0, merges: 0, reachedWin: false, ended: false };
  if (game.over) return unchanged;

  const n = game.size;
  const grid: (Tile | null)[] = new Array(n * n).fill(null);
  for (const t of game.tiles) grid[t.row * n + t.col] = t;

  const tiles: Tile[] = [];
  const ghosts: Tile[] = [];
  let nextId = game.nextId;
  let gained = 0;
  let merges = 0;
  let moved = false;

  for (let line = 0; line < n; line++) {
    let slot = 0;
    // The last tile placed in this line, while it can still take a merge.
    let open: Tile | null = null;
    for (let k = 0; k < n; k++) {
      const [r, c] = cellAt(direction, n, line, k);
      const tile = grid[r * n + c];
      if (!tile) continue;
      if (open && open.value === tile.value) {
        const merged: Tile = { id: nextId++, value: tile.value * 2, row: open.row, col: open.col, origin: "merge" };
        tiles[tiles.indexOf(open)] = merged;
        ghosts.push(open, { ...tile, row: open.row, col: open.col });
        gained += merged.value;
        merges++;
        moved = true;
        open = null;
      } else {
        const [row, col] = cellAt(direction, n, line, slot++);
        const placed = row === tile.row && col === tile.col ? tile : { ...tile, row, col };
        if (placed !== tile) moved = true;
        tiles.push(placed);
        open = placed;
      }
    }
  }
  if (!moved) return unchanged;

  const { tile: spawned, seed } = spawn(tiles, n, nextId, game.seed);
  if (spawned) {
    tiles.push(spawned);
    nextId++;
  }
  tiles.sort(byId);
  ghosts.sort(byId);

  const reachedWin = !game.won && tiles.some((t) => t.value >= WIN_VALUE);
  const over = !canMove(tiles, n);
  return {
    game: {
      ...game,
      tiles,
      ghosts,
      score: game.score + gained,
      moves: game.moves + 1,
      nextId,
      seed,
      won: game.won || reachedWin,
      over,
    },
    moved: true,
    gained,
    merges,
    reachedWin,
    ended: over,
  };
}

/** Drops the ghosts once the slide that made them is over (if no move came since). */
export function settle(game: Game, moves: number): Game {
  return game.moves === moves && game.ghosts.length > 0 ? { ...game, ghosts: [] } : game;
}

export function highestTile(game: Game): number {
  return game.tiles.reduce((max, t) => Math.max(max, t.value), 0);
}

/** A loose check for games read back from storage. */
export function isGame(value: unknown, size: number): value is Game {
  if (!value || typeof value !== "object") return false;
  const g = value as Partial<Game>;
  return (
    typeof g.id === "string" &&
    g.size === size &&
    Array.isArray(g.tiles) &&
    g.tiles.every(
      (t) =>
        t && typeof t.id === "number" && typeof t.value === "number" &&
        Number.isInteger(t.row) && Number.isInteger(t.col) &&
        t.row >= 0 && t.row < size && t.col >= 0 && t.col < size,
    ) &&
    typeof g.score === "number" &&
    typeof g.moves === "number" &&
    typeof g.nextId === "number" &&
    typeof g.seed === "number"
  );
}
