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
  /**
   * The user's locale settings, which can differ from `navigator.language`
   * (English with a German region) and from the region's defaults (a 24-hour
   * clock in the US). Pass `weekStartsOn` to date-fns.
   */
  locale: {
    /** BCP 47, e.g. "en-US". */
    identifier: string;
    language: string;
    region: string;
    /** 0 = Sunday … 6 = Saturday. */
    weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    hourCycle: "h12" | "h23";
    timeZone: string;
    calendar: string;
  };
};

let current: Environment = {
  horizontalSizeClass: "compact",
  verticalSizeClass: "regular",
  colorScheme: "light",
  dynamicTypeSize: "large",
  isAccessibilitySize: false,
  window: { width: 393, height: 852 },
  safeAreaInsets: { top: 59, bottom: 34, leading: 0, trailing: 0 },
  locale: { identifier: "en-US", language: "en", region: "US", weekStartsOn: 0, hourCycle: "h12", timeZone: "UTC", calendar: "gregorian" },
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
    locale: values.locale
      ? {
          identifier: values.locale,
          language: values.language ?? "",
          region: values.region ?? "",
          weekStartsOn: (Number(values.weekStartsOn) || 0) as Environment["locale"]["weekStartsOn"],
          hourCycle: values.hourCycle === "h23" ? "h23" : "h12",
          timeZone: values.timeZone ?? "UTC",
          calendar: values.calendar ?? "gregorian",
        }
      : current.locale,
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
