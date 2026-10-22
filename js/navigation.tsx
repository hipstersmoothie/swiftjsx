import { createContext, useContext, useRef, useState, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { NavigationPage, NavigationStack, NavigationSplitViewHost, SplitColumn, type Modifiers } from "./components";

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

type SplitColumnName = "sidebar" | "content" | "detail";

/**
 * Two or three columns on iPad and Mac; on iPhone it collapses into a stack.
 * There, `preferredCompactColumn` is the column on screen: set it to "detail"
 * when the user picks something, and `onPreferredCompactColumnChange` tells
 * you when they go back.
 *
 *   const [id, setId] = useState<string | null>(null);
 *   <NavigationSplitView
 *     sidebar={<Inbox onSelect={setId} />}
 *     detail={id ? <Message id={id} /> : <Text>Pick a message</Text>}
 *     preferredCompactColumn={id ? "detail" : "sidebar"}
 *     onPreferredCompactColumnChange={(c) => c === "sidebar" && setId(null)}
 *   />
 */
export function NavigationSplitView({
  sidebar,
  content,
  detail,
  ...props
}: Omit<ComponentProps<typeof NavigationSplitViewHost>, "children"> & {
  sidebar: ReactNode;
  content?: ReactNode;
  detail: ReactNode;
}) {
  const columns: [SplitColumnName, ReactNode][] = [["sidebar", sidebar], ["content", content], ["detail", detail]];
  return (
    <NavigationSplitViewHost {...props}>
      {columns.map(([column, children]) =>
        column === "content" && content === undefined ? null : (
          <SplitColumn key={column} column={column}>
            {children}
          </SplitColumn>
        ),
      )}
    </NavigationSplitViewHost>
  );
}
