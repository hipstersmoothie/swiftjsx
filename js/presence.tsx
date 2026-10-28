// Exit animations: a keyed child that leaves stays rendered, animates to its
// `exit` props, and is removed when that animation completes (like Framer
// Motion's AnimatePresence). SwiftUI's own `transition` covers fades, slides
// and scales; this is for animating to props: a merged tile sliding into its
// target, a card flying off where it was swiped.

import { Children, cloneElement, isValidElement, useLayoutEffect, useRef, useState, type Key, type ReactElement, type ReactNode } from "react";
import { withAnimation } from "./renderer";
import type { AnimationSpec, Modifiers } from "./components";

type ExitProps = Partial<Modifiers> & Record<string, unknown>;

export type AnimatePresenceProps = {
  /** Keyed elements. Each must pass the exit props on to a view (host elements do). */
  children?: ReactNode;
  /** Props a leaving child animates to: an object, or per child. */
  exit: ExitProps | ((child: ReactElement) => ExitProps);
  /** The exit animation (default "default"). */
  animation?: AnimationSpec;
  /** After a child has finished leaving. */
  onExitComplete?: (key: string) => void;
};

type Leaving = { element: ReactElement; index: number; exiting: boolean };

export function AnimatePresence({ children, exit, animation = "default", onExitComplete }: AnimatePresenceProps) {
  "use no memo"; // Reads the last committed children from a ref while rendering.
  const current = Children.toArray(children).filter(isValidElement) as ReactElement[];
  const [leaving, setLeaving] = useState<Map<Key, Leaving>>(() => new Map());
  // The children as last committed (latest props), to keep showing one that leaves.
  const previous = useRef<ReactElement[]>([]);
  useLayoutEffect(() => {
    previous.current = current;
  });

  // Adjusting state while rendering: children that just left join `leaving`
  // (still rendered as they were), and children that came back leave it.
  const keys = new Set<Key>(current.map((c) => c.key!));
  let next = leaving;
  previous.current.forEach((element, index) => {
    if (keys.has(element.key!) || next.has(element.key!)) return;
    if (next === leaving) next = new Map(leaving);
    next.set(element.key!, { element, index, exiting: false });
  });
  for (const key of next.keys()) {
    if (!keys.has(key)) continue;
    if (next === leaving) next = new Map(leaving);
    next.delete(key);
  }
  if (next !== leaving) setLeaving(next);

  // Start each leaving child's exit after its "as it was" frame has rendered.
  // withAnimation can't flush from inside an effect, so it runs a tick later.
  const started = useRef(new Set<Key>());
  useLayoutEffect(() => {
    for (const [key, entry] of leaving) {
      if (entry.exiting || started.current.has(key)) continue;
      started.current.add(key);
      queueMicrotask(() =>
        withAnimation(
          animation,
          () => setLeaving((map) => (map.has(key) ? new Map(map).set(key, { ...map.get(key)!, exiting: true }) : map)),
          () => {
            started.current.delete(key);
            setLeaving((map) => {
              if (!map.has(key)) return map;
              const next = new Map(map);
              next.delete(key);
              return next;
            });
            // Children.toArray prefixes keys (".$b"); report the one given.
            onExitComplete?.(String(key).replace(/^\.\$/, ""));
          },
        ),
      );
    }
  });

  // Leaving children keep their old place among the others.
  const rendered: ReactElement[] = [...current];
  [...leaving.values()]
    .sort((a, b) => a.index - b.index)
    .forEach(({ element, index, exiting }) => {
      const shown = exiting ? cloneElement(element as ReactElement<ExitProps>, { ...(typeof exit === "function" ? exit(element) : exit), allowsHitTesting: false }) : element;
      rendered.splice(Math.min(index, rendered.length), 0, shown);
    });
  return <>{rendered}</>;
}
