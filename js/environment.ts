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
};

let current: Environment = {
  horizontalSizeClass: "compact",
  verticalSizeClass: "regular",
  colorScheme: "light",
  dynamicTypeSize: "large",
  isAccessibilitySize: false,
};
const listeners = new Set<() => void>();

(globalThis as any).__swiftjsx_environment = (values: Record<string, string>) => {
  current = {
    horizontalSizeClass: values.horizontalSizeClass === "compact" ? "compact" : "regular",
    verticalSizeClass: values.verticalSizeClass === "compact" ? "compact" : "regular",
    colorScheme: values.colorScheme === "dark" ? "dark" : "light",
    dynamicTypeSize: values.dynamicTypeSize,
    isAccessibilitySize: values.isAccessibilitySize === "true",
  };
  listeners.forEach((listener) => listener());
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The current SwiftUI environment (size classes, color scheme, text size). */
export function useEnvironment(): Environment {
  return useSyncExternalStore(subscribe, () => current);
}

/** "light" or "dark", following the system (or `preferredColorScheme`). */
export function useColorScheme(): "light" | "dark" {
  return useEnvironment().colorScheme;
}
