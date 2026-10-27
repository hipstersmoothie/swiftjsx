// Haptics and the clipboard.

import { nativeCall } from "./renderer";

/** Haptic feedback (iOS): taps for impacts, or the success / warning / error / selection patterns. */
export function haptic(kind: "light" | "medium" | "heavy" | "soft" | "rigid" | "success" | "warning" | "error" | "selection" = "medium") {
  void nativeCall("haptic", { kind });
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
