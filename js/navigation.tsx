import { createContext, useContext, useRef, useState, type ReactElement, type ReactNode } from "react";
import { NavigationPage, NavigationStack, type Modifiers } from "./components";

export type Navigation = {
  /** Push a screen. It's an element, so it can take props like any component. */
  push(screen: ReactElement): void;
  pop(): void;
  popToRoot(): void;
  /** Number of screens pushed on top of the root. */
  depth: number;
};

const NavigationContext = createContext<Navigation | null>(null);

/**
 * A navigation stack whose history lives in React state, like react-navigation.
 * Screens call `useNavigation()` to push and pop.
 *
 *   <Navigator><Inbox /></Navigator>
 *   // in Inbox: nav.push(<Message id={id} />)
 */
export function Navigator({ children, ...modifiers }: Modifiers & { children: ReactNode }) {
  const [stack, setStack] = useState<{ key: number; screen: ReactElement }[]>([]);
  // Keys never repeat, so `pop(); push(x)` in one event mounts a fresh screen
  // instead of handing x the popped screen's state.
  const lastKey = useRef(0);

  // No useMemo needed: the React Compiler memoizes `nav` (it only changes
  // when the depth does).
  const nav: Navigation = {
    push: (screen) => {
      const key = ++lastKey.current;
      setStack((s) => [...s, { key, screen }]);
    },
    pop: () => setStack((s) => s.slice(0, -1)),
    popToRoot: () => setStack([]),
    depth: stack.length,
  };

  return (
    <NavigationContext.Provider value={nav}>
      <NavigationStack {...modifiers} onPathChange={(depth) => setStack((s) => s.slice(0, depth))}>
        <NavigationPage>{children}</NavigationPage>
        {stack.map((entry) => (
          // Each pushed screen gets its own key, so pushing the same component
          // twice gives two independent instances (own state, own effects).
          <NavigationPage key={entry.key}>{entry.screen}</NavigationPage>
        ))}
      </NavigationStack>
    </NavigationContext.Provider>
  );
}

export function useNavigation(): Navigation {
  const nav = useContext(NavigationContext);
  if (!nav) throw new Error("useNavigation() must be used inside <Navigator>");
  return nav;
}
