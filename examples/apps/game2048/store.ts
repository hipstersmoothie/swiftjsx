// Games, best scores and stats per board size, persisted with zustand +
// localStorage. The rules live in game.ts; this adds what isn't pure: ids,
// seeds, the clock, undo and stats.
import { useEffect } from "react";
import { create } from "zustand";
import { useAppState } from "swiftjsx";
import { persist, createJSONStorage } from "zustand/middleware";
import { nanoid } from "nanoid";
import { move, newGame, settle, highestTile, isGame, type Direction, type Game, type MoveResult } from "./game";

export type BoardSize = 4 | 5 | 6;
export const BOARD_SIZES: BoardSize[] = [4, 5, 6];

export type Stats = {
  /** Games with at least one move. */
  played: number;
  won: number;
  bestScore: number;
  bestTile: number;
  totalMoves: number;
  /** Time to the first 2048. */
  fastestWinMs: number | null;
};

type Slot = {
  game: Game;
  /** The game before the last move (one step of undo). */
  previous: Game | null;
  stats: Stats;
};

type State = {
  size: BoardSize;
  slots: Record<number, Slot>;
  /** When the clock started running (not persisted); null while paused. */
  clockSince: number | null;

  setSize(size: BoardSize): void;
  /** Null when the board is waiting on the win card. */
  move(direction: Direction): MoveResult | null;
  /** Drops the ghosts of move number `moves` once its slide is over. */
  settle(gameId: string, moves: number): void;
  undo(): void;
  newGame(): void;
  keepPlaying(): void;
  resumeClock(): void;
  pauseClock(): void;
  resetStats(): void;
};

const emptyStats = (): Stats => ({ played: 0, won: 0, bestScore: 0, bestTile: 0, totalMoves: 0, fastestWinMs: null });
const freshGame = (size: number) => newGame(size, nanoid(8), Math.floor(Math.random() * 2 ** 32), Date.now());
const freshSlot = (size: number): Slot => ({ game: freshGame(size), previous: null, stats: emptyStats() });

/** The game with the running clock's time added. */
const withClock = (game: Game, since: number | null, now: number): Game =>
  since == null ? game : { ...game, elapsedMs: game.elapsedMs + Math.max(0, now - since) };

export const useGame = create<State>()(
  persist(
    (set, get) => {
      const slot = () => get().slots[get().size];
      const putSlot = (next: Slot, extra: Partial<State> = {}) =>
        set((s) => ({ slots: { ...s.slots, [s.size]: next }, ...extra }));

      return {
        size: 4,
        slots: { 4: freshSlot(4) },
        clockSince: null,

        setSize: (size) => {
          if (size === get().size) return;
          get().pauseClock();
          set((s) => ({ size, slots: s.slots[size] ? s.slots : { ...s.slots, [size]: freshSlot(size) } }));
        },

        move: (direction) => {
          const { game, stats } = slot();
          if (game.won && !game.keepPlaying) return null;
          const result = move(game, direction);
          if (!result.moved) return result;
          const now = Date.now();
          const since = get().clockSince;
          const next = withClock(result.game, since, now);
          putSlot(
            {
              game: next,
              previous: { ...game, ghosts: [] },
              stats: {
                played: stats.played + (game.moves === 0 ? 1 : 0),
                won: stats.won + (result.reachedWin ? 1 : 0),
                bestScore: Math.max(stats.bestScore, next.score),
                bestTile: Math.max(stats.bestTile, highestTile(next)),
                totalMoves: stats.totalMoves + 1,
                fastestWinMs: result.reachedWin
                  ? Math.min(stats.fastestWinMs ?? Infinity, next.elapsedMs)
                  : stats.fastestWinMs,
              },
            },
            since == null ? {} : { clockSince: now },
          );
          return { ...result, game: next };
        },

        settle: (gameId, moves) => {
          const current = slot();
          if (current.game.id !== gameId) return;
          const game = settle(current.game, moves);
          if (game !== current.game) putSlot({ ...current, game });
        },

        undo: () => {
          const current = slot();
          if (!current.previous) return;
          const now = Date.now();
          const since = get().clockSince;
          // Undo rewinds the board, not the clock, and a win stays a win
          // (undoing out of the win card means playing on).
          const live = withClock(current.game, since, now);
          putSlot(
            {
              ...current,
              game: {
                ...current.previous,
                ghosts: [],
                elapsedMs: live.elapsedMs,
                won: live.won,
                keepPlaying: live.keepPlaying || live.won,
              },
              previous: null,
            },
            since == null ? {} : { clockSince: now },
          );
        },

        newGame: () => {
          get().pauseClock();
          const current = slot();
          putSlot({ ...current, game: freshGame(get().size), previous: null });
        },

        keepPlaying: () => {
          const current = slot();
          putSlot({ ...current, game: { ...current.game, keepPlaying: true } });
        },

        resumeClock: () => {
          if (get().clockSince == null) set({ clockSince: Date.now() });
        },

        pauseClock: () => {
          const since = get().clockSince;
          if (since == null) return;
          const current = slot();
          putSlot({ ...current, game: withClock(current.game, since, Date.now()) }, { clockSince: null });
        },

        resetStats: () => {
          const current = slot();
          putSlot({ ...current, stats: emptyStats() });
        },
      };
    },
    {
      name: "game2048",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Ghosts only live for a slide; the clock restarts paused.
      partialize: (s) => ({
        size: s.size,
        slots: Object.fromEntries(
          Object.entries(s.slots).map(([size, slot]) => [size, { ...slot, game: { ...slot.game, ghosts: [] } }]),
        ),
      }),
      // Anything that doesn't look like a game is replaced with a new one.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as { size?: unknown; slots?: Record<string, Partial<Slot> | undefined> };
        const slots: Record<number, Slot> = { ...current.slots };
        for (const size of BOARD_SIZES) {
          const s = saved.slots?.[size];
          if (!s || !isGame(s.game, size)) continue;
          slots[size] = {
            game: { ...s.game, ghosts: [] },
            previous: isGame(s.previous, size) ? { ...s.previous, ghosts: [] } : null,
            stats: { ...emptyStats(), ...s.stats },
          };
        }
        const size = BOARD_SIZES.find((n) => n === saved.size) ?? current.size;
        if (!slots[size]) slots[size] = freshSlot(size);
        return { ...current, size, slots };
      },
    },
  ),
);

/** The current board's slot (raw state, so the selector is stable). */
export const useSlot = () => useGame((s) => s.slots[s.size]);

/**
 * Runs the game clock while `active` (a game in progress, on screen) and the
 * app is in front; pauses it otherwise, committing the time to the game.
 */
export function useGameClock(active: boolean, gameId: string) {
  const appState = useAppState();
  const running = active && appState === "active";
  useEffect(() => {
    if (!running) return;
    useGame.getState().resumeClock();
    return () => useGame.getState().pauseClock();
  }, [running, gameId]);
}
