// Haptics and the clipboard.

import { nativeCall } from "./renderer";

/** Haptic feedback (iOS): taps for impacts, or the success / warning / error / selection patterns. */
export function haptic(kind: "light" | "medium" | "heavy" | "soft" | "rigid" | "success" | "warning" | "error" | "selection" = "medium") {
  void nativeCall("haptic", { kind });
}
// Callable from worklets too: there it plays right away on the main thread
// (a drag crossing a threshold), without a hop to JS.
(haptic as unknown as { __builtin: string }).__builtin = "haptic";

/**
 * Downloads and decodes an image into `<Image src>`'s cache, so it shows
 * without a placeholder when it appears (the next carousel page or story).
 * Resolves to whether it loaded.
 */
/** The system share sheet; resolves true if the user shared (or copied, saved…), false if they cancelled. */
export async function share(content: { text?: string; url?: string }): Promise<boolean> {
  return (await nativeCall("share", content)) === true;
}

export function prefetchImage(url: string): Promise<boolean> {
  return nativeCall("prefetchImage", { url }) as Promise<boolean>;
}

// navigator.clipboard (text only), on the system pasteboard.
(globalThis as any).navigator.clipboard = {
  async writeText(text: string): Promise<void> {
    await nativeCall("clipboardWrite", { text: String(text) });
  },
  async readText(): Promise<string> {
    return (await nativeCall("clipboardRead", {})) as string;
  },
};

/**
 * Downloads and registers a font (a .ttf / .otf URL, or a file: URL) for
 * this run of the app; use one of its `names` (PostScript names) as
 * `font={{ name, size }}`. No Info.plist entry needed.
 */
export async function loadFont(url: string): Promise<{ family: string; names: string[] }> {
  const result = (await nativeCall("loadFont", { url })) as { family: string; names: string[]; error?: string };
  if (result.error) throw new Error(`loadFont(${url}): ${result.error}`);
  return result;
}

const storage = (op: string, args: Record<string, unknown> = {}) => nativeCall("asyncStorage", { op, ...args });

/**
 * React Native's AsyncStorage: strings by key, saved as files off the main
 * and JS threads; no size limit (unlike localStorage). Works with zustand's
 * `createJSONStorage(() => AsyncStorage)`.
 */
export const AsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    return ((await storage("get", { keys: [key] })) as (string | null)[])[0] ?? null;
  },
  async setItem(key: string, value: string): Promise<void> {
    await storage("set", { pairs: [[key, String(value)]] });
  },
  async removeItem(key: string): Promise<void> {
    await storage("remove", { keys: [key] });
  },
  async mergeItem(key: string, value: string): Promise<void> {
    const existing = await AsyncStorage.getItem(key);
    const merged = existing ? { ...JSON.parse(existing), ...JSON.parse(value) } : JSON.parse(value);
    await AsyncStorage.setItem(key, JSON.stringify(merged));
  },
  async getAllKeys(): Promise<string[]> {
    return (await storage("keys")) as string[];
  },
  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    const values = (await storage("get", { keys })) as (string | null)[];
    return keys.map((key, i) => [key, values[i] ?? null]);
  },
  async multiSet(pairs: [string, string][]): Promise<void> {
    await storage("set", { pairs: pairs.map(([k, v]) => [k, String(v)]) });
  },
  async multiRemove(keys: string[]): Promise<void> {
    await storage("remove", { keys });
  },
  async clear(): Promise<void> {
    await storage("clear");
  },
};
