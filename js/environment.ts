// The SwiftUI environment, for React: size classes (iPhone vs iPad layouts),
// color scheme and text size. Updates re-render the components that use them.

import { useSyncExternalStore } from "react";

export type Environment = {
  /** "compact" on iPhone (portrait), "regular" on iPad and wide windows. */
  horizontalSizeClass: "compact" | "regular";
  verticalSizeClass: "compact" | "regular";
  colorScheme: "light" | "dark";
  /** SwiftUI's DynamicTypeSize, e.g. "large" (the default) or "accessibility2". */
  dynamicTypeSize: string;
  isAccessibilitySize: boolean;
  /** The app's window size in points (the whole screen on iPhone), including the safe area. */
  window: { width: number; height: number };
  /** Space taken by the status bar, home indicator and notch (keyboard not included). */
  safeAreaInsets: { top: number; bottom: number; leading: number; trailing: number };
};

let current: Environment = {
  horizontalSizeClass: "compact",
  verticalSizeClass: "regular",
  colorScheme: "light",
  dynamicTypeSize: "large",
  isAccessibilitySize: false,
  window: { width: 393, height: 852 },
  safeAreaInsets: { top: 59, bottom: 34, leading: 0, trailing: 0 },
};
const listeners = new Set<() => void>();

(globalThis as any).__swiftjsx_environment = (values: Record<string, string>) => {
  current = {
    horizontalSizeClass: values.horizontalSizeClass === "compact" ? "compact" : "regular",
    verticalSizeClass: values.verticalSizeClass === "compact" ? "compact" : "regular",
    colorScheme: values.colorScheme === "dark" ? "dark" : "light",
    dynamicTypeSize: values.dynamicTypeSize,
    isAccessibilitySize: values.isAccessibilitySize === "true",
    window: { width: Number(values.width) || current.window.width, height: Number(values.height) || current.window.height },
    safeAreaInsets: {
      top: Number(values.safeTop) || 0,
      bottom: Number(values.safeBottom) || 0,
      leading: Number(values.safeLeading) || 0,
      trailing: Number(values.safeTrailing) || 0,
    },
  };
  listeners.forEach((listener) => listener());
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The current SwiftUI environment (size classes, color scheme, text size, window size, safe area). */
export function useEnvironment(): Environment {
  return useSyncExternalStore(subscribe, () => current);
}

/** "light" or "dark", following the system (or `preferredColorScheme`). */
export function useColorScheme(): "light" | "dark" {
  return useEnvironment().colorScheme;
}
