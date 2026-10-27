// Copy and paste through `navigator.clipboard` (the system pasteboard). Older
// runtimes without it get an in-app clipboard, so Copy/Paste still work
// within the app (and the UI says where the text went).

let inApp: string | null = null;

const system = () => (typeof navigator === "object" && typeof navigator.clipboard?.writeText === "function" ? navigator.clipboard : null);

/** Where copied text goes: "system" (the pasteboard) or "app" (this app only). */
export const clipboardKind = (): "system" | "app" => (system() ? "system" : "app");

export async function copyText(text: string): Promise<void> {
  const clipboard = system();
  if (clipboard) await clipboard.writeText(text);
  else inApp = text;
}

/** The clipboard's text (iOS may ask the user to allow pasting). */
export async function readText(): Promise<string | null> {
  const clipboard = system();
  return clipboard ? clipboard.readText() : inApp;
}
