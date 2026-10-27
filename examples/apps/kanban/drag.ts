// Drag and drop for cards, built from what SwiftJSX offers today:
//
// - The finger is tracked on the main thread: a card's `onDrag` worklet writes
//   the translation into a shared value, and a floating copy of the card (the
//   "ghost", drawn over the board) follows it through an animated style.
// - Drop targets are computed on the JS thread from frames `measure()`d when
//   the card is picked up, kept current while the board and the columns
//   scroll with their `onScroll` offsets.
// - Auto-scroll steps one column (or one card) at a time with
//   `scrollTo(ref, { anchor })`: there's no way to scroll by a distance.
//
// The ghost exists because the columns' scroll views clip their cards:
// `zIndex` only orders siblings, it can't lift a card out of its column.
import { useEffect, useState } from "react";
import { useSharedValue, withSpring, withAnimation, haptic, type Frame, type HostInstance } from "swiftjsx";

/** A column as it's shown: its id and its visible cards, in order. */
export type Lane = { id: string; cardIds: string[] };
/** Where the card would land: before `beforeId` (null: at the end). */
export type DropTarget = { columnId: string; index: number; beforeId: string | null };

export type ActiveDrag = {
  cardId: string;
  fromColumnId: string;
  /** The card's frame (window coordinates) when it was picked up. */
  frame: Frame;
  /** Frame of the view the ghost is drawn in. */
  origin: Frame;
  /** Where the finger grabbed the card, from its top-left corner. */
  grab: { x: number; y: number };
  target: DropTarget;
  /** Let go: the ghost is flying to its slot. */
  dropping: boolean;
};

type Point = { x: number; y: number };
type CardBox = { id: string; top: number; height: number };
/**
 * A lane's frames, laid out as if the dragged card and the placeholder
 * weren't there; `scrollY` is its list's scroll offset when measured.
 */
type LaneGeometry = { id: string; frame: Frame; list: Frame | null; cards: CardBox[]; scrollY: number };
/** `scrollX`: the board's scroll offset when measured. */
type Geometry = { board: Frame; lanes: LaneGeometry[]; scrollX: number };
type ScrollEvent = { x: number; y: number };

/** Points from the board's (or a column's) edge where auto-scroll kicks in. */
const EDGE = 56;
/** Seconds between auto-scroll steps (one column, or one card). */
const STEP_DELAY = 450;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const sameTarget = (a: DropTarget, b: DropTarget) => a.columnId === b.columnId && a.beforeId === b.beforeId && a.index === b.index;

type Options = { lanes: Lane[]; onDrop(cardId: string, columnId: string, beforeId: string | null): void };

export function useCardDrag({ lanes, onDrop }: Options) {
  const [active, setActive] = useState<ActiveDrag | null>(null);
  /** The finger's translation since the drag started; `id` is the card being dragged. */
  const position = useSharedValue({ id: "", x: 0, y: 0 });
  /** 0 → 1 as the ghost lifts off the board. */
  const lift = useSharedValue(0);
  // Created once, so its handlers keep their identity: the cards' worklets
  // capture them, and a new function would re-send every card's worklets.
  const [controller] = useState(() => createController(setActive, position, lift));

  useEffect(() => controller.sync(lanes, onDrop));
  // Reset the ghost's position only after the commit that removed it, or it
  // would jump back to where the card was picked up for a frame.
  useEffect(() => {
    if (!active) position.set({ id: "", x: 0, y: 0 });
  }, [active, position]);
  useEffect(() => controller.dispose, [controller]);

  return { active, position, lift, ...controller.handlers };
}

export type CardDrag = ReturnType<typeof useCardDrag>;

type Shared<T> = { set(value: T): void };

function createController(
  setActive: (drag: ActiveDrag | null) => void,
  position: Shared<{ id: string; x: number; y: number }>,
  lift: Shared<number>,
) {
  // Everything the handlers need between events (they run per touch move, so no React state).
  const nodes = new Map<string, HostInstance>();
  const refs = new Map<string, (node: HostInstance | null) => void>();
  /** Latest scroll offsets of the board ("board") and the columns ("list:<id>"). */
  const scroll = new Map<string, ScrollEvent>();
  const s = {
    lanes: [] as Lane[],
    onDrop: (() => {}) as Options["onDrop"],
    active: null as ActiveDrag | null,
    geometry: null as Geometry | null,
    last: null as Point | null,
    picking: false,
    pendingDrop: null as Point | null,
    timer: undefined as ReturnType<typeof setTimeout> | undefined,
  };

  const measure = (key: string): Promise<Frame | null> => nodes.get(key)?.measure() ?? Promise.resolve(null);
  const offset = (key: string) => scroll.get(key) ?? { x: 0, y: 0 };

  const update = (next: ActiveDrag | null, animated: boolean) => {
    s.active = next;
    if (animated) withAnimation({ type: "snappy", duration: 0.28 }, () => setActive(next));
    else setActive(next);
  };

  /** Frames of every column and visible card, minus the placeholder's room in `target`'s column. */
  async function measureLanes(draggedId: string, target: DropTarget, height: number): Promise<LaneGeometry[]> {
    const measured = await Promise.all(
      s.lanes.map(async (lane) => {
        const others = lane.cardIds.filter((id) => id !== draggedId);
        const [frame, list, ...cards] = await Promise.all([
          measure(`col:${lane.id}`),
          measure(`list:${lane.id}`),
          ...others.map((id) => measure(`card:${id}`)),
        ]);
        if (!frame) return null;
        const boxes: CardBox[] = [];
        others.forEach((id, i) => {
          const f = cards[i];
          // Cards after the placeholder sit one card lower than they will without it.
          const shift = lane.id === target.columnId && i >= target.index ? height : 0;
          if (f) boxes.push({ id, top: f.y - shift, height: f.height });
        });
        return { id: lane.id, frame, list, cards: boxes, scrollY: offset(`list:${lane.id}`).y };
      }),
    );
    return measured.filter((g): g is LaneGeometry => g !== null);
  }

  /** The measured lanes, moved by how far the board and each column have scrolled since. */
  function lanesNow(g: Geometry): LaneGeometry[] {
    const dx = offset("board").x - g.scrollX;
    return g.lanes.map((lane) => {
      const dy = offset(`list:${lane.id}`).y - lane.scrollY;
      return {
        ...lane,
        frame: { ...lane.frame, x: lane.frame.x - dx },
        list: lane.list && { ...lane.list, x: lane.list.x - dx },
        cards: dy ? lane.cards.map((c) => ({ ...c, top: c.top - dy })) : lane.cards,
      };
    });
  }

  /** The slot under the dragged card's center. */
  function hitTest(finger: Point): DropTarget | null {
    const { active: a, geometry: g } = s;
    if (!a || !g || !g.lanes.length) return null;
    const lanes = lanesNow(g);
    const cx = finger.x - a.grab.x + a.frame.width / 2;
    const cy = finger.y - a.grab.y + a.frame.height / 2;
    const lane =
      lanes.find((l) => cx >= l.frame.x && cx <= l.frame.x + l.frame.width) ??
      lanes.reduce((best, l) =>
        Math.abs(l.frame.x + l.frame.width / 2 - cx) < Math.abs(best.frame.x + best.frame.width / 2 - cx) ? l : best,
      );
    // Compare with the cards where they are now: those after the placeholder
    // are one card lower. (Gives hysteresis: no flip-flopping at a midpoint.)
    const current = a.target.columnId === lane.id ? a.target.index : Infinity;
    const index = lane.cards.filter((c, i) => c.top + (i >= current ? a.frame.height : 0) + c.height / 2 < cy).length;
    return { columnId: lane.id, index, beforeId: lane.cards[index]?.id ?? null };
  }

  function retarget(finger: Point) {
    const a = s.active;
    if (!a || a.dropping) return;
    const target = hitTest(finger);
    if (!target || sameTarget(target, a.target)) return;
    update({ ...a, target }, true);
    haptic("selection");
  }

  /** Which way to auto-scroll for a finger at `finger`: the board sideways, or the target column up/down. */
  function edges(finger: Point) {
    const { active: a, geometry: g } = s;
    if (!a || !g) return { dx: 0, dy: 0 };
    const b = g.board;
    const dx = finger.x < b.x + EDGE ? -1 : finger.x > b.x + b.width - EDGE ? 1 : 0;
    const list = lanesNow(g).find((l) => l.id === a.target.columnId)?.list;
    const dy = !list ? 0 : finger.y < list.y + EDGE ? -1 : finger.y > list.y + list.height - EDGE ? 1 : 0;
    return { dx, dy };
  }

  /** Scrolls one step toward the edge the finger is at. Returns whether it did. */
  function step(dx: number, dy: number): boolean {
    const { active: a, geometry: g } = s;
    if (!a || !g) return false;
    const b = g.board;
    const lanes = lanesNow(g);
    if (dx) {
      const lanesByX = [...lanes].sort((p, q) => p.frame.x - q.frame.x);
      const lane =
        dx > 0
          ? lanesByX.find((l) => l.frame.x + l.frame.width > b.x + b.width + 1)
          : [...lanesByX].reverse().find((l) => l.frame.x < b.x - 1);
      const target = lane && nodes.get(`col:${lane.id}`);
      if (!target) return false;
      nodes.get("board")?.scrollTo(target, { anchor: dx > 0 ? "trailing" : "leading" });
      return true;
    }
    if (dy) {
      const lane = lanes.find((l) => l.id === a.target.columnId);
      const list = lane?.list;
      if (!lane || !list) return false;
      const card =
        dy > 0
          ? lane.cards.find((c) => c.top + c.height > list.y + list.height + 1)
          : [...lane.cards].reverse().find((c) => c.top < list.y - 1);
      const target = card && nodes.get(`card:${card.id}`);
      if (!target) return false;
      nodes.get(`list:${lane.id}`)?.scrollTo(target, { anchor: dy > 0 ? "bottom" : "top" });
      return true;
    }
    return false;
  }

  function autoScroll() {
    if (!s.active || s.active.dropping || !s.last || s.timer) return;
    const { dx, dy } = edges(s.last);
    if (!step(dx, dy)) return;
    // onScroll keeps the geometry current meanwhile; step again while the finger stays at the edge.
    s.timer = setTimeout(() => {
      s.timer = undefined;
      autoScroll();
    }, STEP_DELAY);
  }

  function stopAutoScroll() {
    clearTimeout(s.timer);
    s.timer = undefined;
  }

  const handlers = {
    /** A callback ref that registers a node under `key` (for measure() and scrollTo()). Stable per key. */
    ref(key: string) {
      let fn = refs.get(key);
      if (!fn) {
        fn = (node) => {
          if (node) nodes.set(key, node);
          else if (nodes.get(key)) nodes.delete(key);
        };
        refs.set(key, fn);
      }
      return fn;
    },

    /** An `onScroll` handler for the scroll view registered as `key`. */
    scrolled(key: string) {
      return (event: ScrollEvent) => {
        scroll.set(key, { x: event.x, y: event.y });
        // Content moved under a still finger (auto-scroll): the slot under it changed.
        if (s.active && s.last) retarget(s.last);
      };
    },

    // Called from the cards' gesture worklets (through runOnJS):

    /** The drag started on `cardId`, at `start` (window coordinates). */
    async pickUp(cardId: string, startX: number, startY: number) {
      if (s.active || s.picking) return;
      const lane = s.lanes.find((l) => l.cardIds.includes(cardId));
      if (!lane) return;
      s.picking = true;
      const [origin, board, frame] = await Promise.all([measure("container"), measure("board"), measure(`card:${cardId}`)]);
      if (!origin || !board || !frame) {
        s.picking = false;
        return;
      }
      const index = lane.cardIds.indexOf(cardId);
      const others = lane.cardIds.filter((id) => id !== cardId);
      const target: DropTarget = { columnId: lane.id, index, beforeId: others[index] ?? null };
      const next: ActiveDrag = { cardId, fromColumnId: lane.id, frame, origin, grab: { x: startX - frame.x, y: startY - frame.y }, target, dropping: false };
      s.geometry = { board, lanes: await measureLanes(cardId, target, frame.height), scrollX: offset("board").x };
      s.picking = false;
      update(next, false);
      lift.set(withSpring(1, { duration: 0.25, bounce: 0.35 }));
      haptic("medium");
      if (s.pendingDrop) {
        const at = s.pendingDrop;
        s.pendingDrop = null;
        void handlers.drop(at.x, at.y);
      }
    },

    /** The finger moved (window coordinates). */
    move(x: number, y: number) {
      s.last = { x, y };
      retarget(s.last);
      autoScroll();
    },

    /** The finger lifted: settle the ghost into the placeholder, then commit the move. */
    async drop(x: number, y: number) {
      stopAutoScroll();
      if (s.picking) {
        s.pendingDrop = { x, y };
        return;
      }
      const a = s.active;
      if (!a || a.dropping) return;
      const target = hitTest({ x, y }) ?? a.target;
      update({ ...a, target, dropping: true }, true);
      // The placeholder's frame once that commit is laid out.
      await delay(40);
      const slot = await measure("placeholder");
      const to = slot ? { x: slot.x - a.frame.x, y: slot.y - a.frame.y } : { x: 0, y: 0 };
      position.set(withSpring({ id: a.cardId, ...to }, { duration: 0.3, bounce: 0.15 }));
      lift.set(withSpring(0, { duration: 0.3 }));
      await delay(260);
      s.onDrop(a.cardId, target.columnId, target.beforeId);
      s.geometry = null;
      s.last = null;
      update(null, false);
      haptic("light");
    },

    /** Abandons a drag (e.g. the gesture was cancelled and never ended). */
    cancel() {
      stopAutoScroll();
      s.geometry = null;
      s.pendingDrop = null;
      s.picking = false;
      lift.set(0);
      update(null, false);
    },
  };

  return {
    handlers,
    sync(lanes: Lane[], onDrop: Options["onDrop"]) {
      s.lanes = lanes;
      s.onDrop = onDrop;
    },
    dispose() {
      stopAutoScroll();
    },
  };
}
