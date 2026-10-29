// toast(): a short message over everything (sheets included) that goes away
// by itself. The host is mounted next to the app by render().

import { useSyncExternalStore, type ReactNode } from "react";
import { HStack, Image, Text, Button, Portal, type ColorValue } from "./components";
import { haptic } from "./platform";
import { addRootElement, nativeCall, withAnimation } from "./renderer";

export type ToastOptions = {
  systemImage?: string;
  /** The symbol's color. */
  tint?: ColorValue;
  /** Seconds on screen (default 2.5; 4 with an action). */
  duration?: number;
  /** Played as it appears. */
  haptic?: "success" | "warning" | "error" | "light" | "selection";
  /** A button in the toast ("Undo"); tapping it runs `onPress` and closes the toast. */
  action?: { title: string; onPress: () => void };
};

type Shown = ToastOptions & { id: number; text: string };

let nextId = 1;
let current: Shown | null = null;
const queue: Shown[] = [];
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | null = null;
let placement: { position: "top" | "bottom"; offset: number } = { position: "bottom", offset: 56 };

function show(next: Shown | null) {
  withAnimation({ type: "spring", duration: 0.35, bounce: 0.2 }, () => {
    current = next;
    listeners.forEach((l) => l());
  });
  if (timer) clearTimeout(timer);
  timer = null;
  if (!next) {
    // The next one after this one has gone.
    if (queue.length) timer = setTimeout(() => show(queue.shift()!), 250);
    return;
  }
  if (next.haptic) haptic(next.haptic);
  void nativeCall("announce", { text: next.text });
  timer = setTimeout(() => show(null), (next.duration ?? (next.action ? 4 : 2.5)) * 1000);
}

/**
 * Shows a short message ("Copied", "Saved to Favorites") over the app,
 * sheets included, for a couple of seconds; VoiceOver reads it out. While one
 * shows, the next waits its turn. Returns a function that hides it early.
 */
export function toast(text: string, options: ToastOptions = {}): () => void {
  const shown: Shown = { ...options, id: nextId++, text };
  if (current) queue.push(shown);
  else show(shown);
  return () => {
    const index = queue.indexOf(shown);
    if (index >= 0) queue.splice(index, 1);
    else if (current?.id === shown.id) show(null);
  };
}

/** Where toasts appear: the bottom (default, `offset` above the tab bar) or the top. */
export function configureToasts(options: Partial<typeof placement>) {
  placement = { ...placement, ...options };
}

/** Mounted next to the app by render(). */
function ToastHost(): ReactNode {
  const shown = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
  );
  const top = placement.position === "top";
  return (
    <Portal alignment={top ? "top" : "bottom"} interactive={!!shown?.action}>
      {shown ? (
        <HStack
          key={shown.id}
          spacing={10}
          padding={{ horizontal: 18, vertical: 12 }}
          background="regularMaterial"
          cornerRadius="capsule"
          shadow={{ radius: 12, y: 4, color: "black/15" }}
          offset={{ x: 0, y: top ? 0 : -placement.offset }}
          transition={{ type: "move", edge: top ? "top" : "bottom" }}
          accessibilityElement="combine"
          accessibilityIdentifier="toast"
        >
          {shown.systemImage ? <Image systemName={shown.systemImage} foregroundStyle={shown.tint ?? "primary"} font="headline" /> : null}
          <Text font="subheadline" fontWeight="semibold" lineLimit={2}>{shown.text}</Text>
          {shown.action ? (
            <Button
              title={shown.action.title}
              font="subheadline"
              fontWeight="bold"
              onPress={() => {
                shown.action!.onPress();
                show(null);
              }}
            />
          ) : null}
        </HStack>
      ) : null}
    </Portal>
  );
}

addRootElement("swiftjsx-toasts", <ToastHost />);
