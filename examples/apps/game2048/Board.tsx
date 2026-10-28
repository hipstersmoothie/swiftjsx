// The board: empty cells, the tiles, then the win / game over card. Every
// tile is one view keyed by its id and placed with `offset`, so moving a tile
// is just a new offset that its `animation` (SLIDE) springs to.
//
// Each tile is two parts: a positioned frame (mounted with the tile) and the
// numbered face, inserted into it a moment later with a scale transition.
// Two reasons:
//  - A transition applies to the whole inserted view, transforms included,
//    so scaling a view placed with `offset` would scale its offset too: the
//    tile would grow out of the top-left cell. The face isn't offset itself.
//  - Insertions are animated by the *parent's* `animation`, so the face's
//    parent picks how it appears: spawned tiles grow in after the slide
//    (APPEAR), merged tiles overshoot and settle (POP).
//
// Swipes are read on the main thread (worklets): the board follows the finger
// a few points along the locked axis and the move fires as soon as the drag
// passes the threshold, without waiting for the finger to lift.
import { useEffect, useState, type ReactNode } from "react";
import { ZStack, VStack, Text, RoundedRectangle, useSharedValue, useAnimatedStyle, withSpring, runOnJS, type SharedValue } from "swiftjsx";
import type { Direction, Game, Tile } from "./game";
import { palette, tileStyle, tileFontSize, boardGeometry, SLIDE, APPEAR, POP, VANISH, OVERLAY, FACE_DELAY_MS, type BoardGeometry } from "./theme";

type Point = { x: number; y: number };
type Nudge = SharedValue<Point>;

/** Points along the locked axis before a drag counts as a swipe. */
const SWIPE_DISTANCE = 34;
/** Points before the drag picks its axis (direction locking). */
const LOCK_DISTANCE = 12;
/** A short drag still counts if the finger was flicked this far (predicted). */
const FLICK_DISTANCE = 90;
/** How far the board leans with the finger before the move fires. */
const MAX_LEAN = 8;

const lean = (d: number) => {
  "worklet";
  return Math.max(-MAX_LEAN, Math.min(MAX_LEAN, d * 0.18));
};

const directionOf = (axis: string, d: number) => {
  "worklet";
  return axis === "x" ? (d > 0 ? "right" : "left") : d > 0 ? "down" : "up";
};

type AreaProps = {
  game: Game;
  /** Shared with the screen, which nudges the board when a move does nothing. */
  nudge: Nudge;
  /** False while a card covers the board (the board doesn't lean). */
  enabled: boolean;
  onSwipe(direction: Direction): void;
  overlay: ReactNode;
};

/** Takes the space it's given; the board is the largest square that fits, centered. */
export function BoardArea({ game, nudge, enabled, onSwipe, overlay }: AreaProps) {
  const [space, setSpace] = useStateSize();
  const side = space ? Math.floor(Math.min(space.width, space.height)) : 0;

  // Per gesture: the locked axis ("" until locked), whether it already fired,
  // and where it started. An immediate drag has no "began" event (onDragStart
  // is only for long-press activation), so a new startLocation is how the
  // handler knows a new gesture started, even if the last one's end was lost.
  const axis = useSharedValue("");
  const fired = useSharedValue(false);
  const start = useSharedValue<Point>({ x: -1, y: -1 });

  return (
    <VStack
      frame={{ maxWidth: "infinity", maxHeight: "infinity" }}
      contentShape="rectangle"
      onLayout={setSpace}
      // Always attached: a gesture prop that first appears on a mounted view
      // resets its SwiftUI state, so `enabled` is checked inside instead.
      onDrag={(e) => {
        "worklet";
        const s = start.get();
        if (s.x !== e.startLocation.x || s.y !== e.startLocation.y) {
          start.set(e.startLocation);
          axis.set("");
          fired.set(false);
        }
        if (fired.get() || !enabled) return;
        const { x, y } = e.translation;
        if (axis.get() === "") {
          if (Math.hypot(x, y) < LOCK_DISTANCE) return;
          axis.set(Math.abs(x) >= Math.abs(y) ? "x" : "y");
        }
        const locked = axis.get();
        const d = locked === "x" ? x : y;
        if (Math.abs(d) >= SWIPE_DISTANCE) {
          fired.set(true);
          nudge.set(withSpring({ x: 0, y: 0 }, { duration: 0.3, bounce: 0.4 }));
          runOnJS(onSwipe)(directionOf(locked, d));
          return;
        }
        nudge.set(locked === "x" ? { x: lean(d), y: 0 } : { x: 0, y: lean(d) });
      }}
      onDragEnd={(e) => {
        "worklet";
        const locked = axis.get();
        // A cancelled drag (the sheet took over…) never counts as a flick.
        if (enabled && !e.cancelled && !fired.get() && locked !== "") {
          const d = locked === "x" ? e.translation.x : e.translation.y;
          const flick = locked === "x" ? e.predictedEndTranslation.x : e.predictedEndTranslation.y;
          if (Math.abs(d) >= LOCK_DISTANCE && Math.abs(flick) >= FLICK_DISTANCE && Math.sign(flick) === Math.sign(d)) {
            runOnJS(onSwipe)(directionOf(locked, d));
          }
        }
        axis.set("");
        fired.set(false);
        start.set({ x: -1, y: -1 });
        nudge.set(withSpring({ x: 0, y: 0 }, { duration: 0.3, bounce: 0.4 }));
      }}
    >
      <Board game={game} side={side} nudge={nudge} overlay={overlay} />
    </VStack>
  );
}

// onLayout reports on every change; keep only whole-point changes.
type Size = { width: number; height: number };
function useStateSize(): [Size | null, (size: Size) => void] {
  const [size, setSize] = useState<Size | null>(null);
  const update = (next: Size) =>
    setSize((prev) =>
      prev && Math.round(prev.width) === Math.round(next.width) && Math.round(prev.height) === Math.round(next.height) ? prev : next,
    );
  return [size, update];
}

type BoardProps = { game: Game; side: number; nudge: Nudge; overlay: ReactNode };

function Board({ game, side, nudge, overlay }: BoardProps) {
  const g = boardGeometry(side, game.size);
  const leanStyle = useAnimatedStyle(() => ({ offset: nudge.get() }));
  const cells: { row: number; col: number }[] = [];
  for (let row = 0; row < game.size; row++) for (let col = 0; col < game.size; col++) cells.push({ row, col });

  // Live tiles and ghosts together, by id, so React never reorders the views
  // (and a merged tile, newer than its ghosts, draws over them).
  const items = [...game.tiles.map((tile) => ({ tile, ghost: false })), ...game.ghosts.map((tile) => ({ tile, ghost: true }))]
    .sort((a, b) => a.tile.id - b.tile.id);
  const square = { width: side, height: side, alignment: "topLeading" as const };

  return (
    <ZStack
      alignment="topLeading"
      frame={square}
      background={palette.board}
      cornerRadius={Math.max(6, side * 0.018)}
      animatedStyle={leanStyle}
      accessibilityElement="contain"
      accessibilityIdentifier="board"
      accessibilityLabel={`${game.size} by ${game.size} board`}
    >
      <ZStack alignment="topLeading" frame={square} accessibilityHidden>
        {cells.map(({ row, col }) => (
          <RoundedRectangle
            key={`${row}-${col}`}
            fill={palette.cell}
            cornerRadius={g.radius}
            frame={{ width: g.cell, height: g.cell }}
            offset={{ x: g.origin(col), y: g.origin(row) }}
          />
        ))}
      </ZStack>
      {/* Its animation is for tiles leaving: ghosts and a finished game's tiles fade out. */}
      <ZStack alignment="topLeading" frame={square} animation={VANISH} allowsHitTesting={false}>
        {side > 0
          ? items.map(({ tile, ghost }) => <TileView key={`${game.id}:${tile.id}`} tile={tile} ghost={ghost} g={g} size={game.size} />)
          : null}
      </ZStack>
      <ZStack frame={{ width: side, height: side }} animation={OVERLAY}>
        {overlay}
      </ZStack>
    </ZStack>
  );
}

type TileProps = { tile: Tile; ghost: boolean; g: BoardGeometry; size: number };

function TileView({ tile, ghost, g, size }: TileProps) {
  // The face goes in one commit after the frame: inserted in the same commit
  // it would be part of the frame's own (unanimated) appearance.
  const [faceShown, setFaceShown] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setFaceShown(true), FACE_DELAY_MS);
    return () => clearTimeout(id);
  }, []);

  return (
    <ZStack
      frame={{ width: g.cell, height: g.cell }}
      offset={{ x: g.origin(tile.col), y: g.origin(tile.row) }}
      // Ghosts slide under the tile they merged into.
      zIndex={ghost ? 0 : 1}
      animation={SLIDE}
      accessibilityElement="ignore"
      accessibilityIdentifier={`tile-${tile.value}`}
      accessibilityLabel={`${tile.value}, row ${tile.row + 1} of ${size}, column ${tile.col + 1}`}
      accessibilityHidden={ghost}
    >
      <ZStack animation={tile.origin === "merge" ? POP : APPEAR}>
        {faceShown ? <TileFace value={tile.value} g={g} /> : null}
      </ZStack>
    </ZStack>
  );
}

function TileFace({ value, g }: { value: number; g: BoardGeometry }) {
  const style = tileStyle(value);
  return (
    <Text
      font={{ size: tileFontSize(value, g.cell), weight: "bold" }}
      foregroundStyle={style.foreground}
      lineLimit={1}
      minimumScaleFactor={0.5}
      // With an `animation`, Text rolls changed digits by default; a tile's
      // number never changes, but its size does (board resizes).
      contentTransition="identity"
      padding={{ horizontal: g.cell * 0.06 }}
      frame={{ width: g.cell, height: g.cell }}
      background={style.background}
      cornerRadius={g.radius}
      shadow={style.glow > 0 ? { radius: g.cell * 0.18 * style.glow, color: "#F3D774B0" } : undefined}
      animation={SLIDE}
      transition="scale"
    >
      {String(value)}
    </Text>
  );
}
