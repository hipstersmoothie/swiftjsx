// Keep the screen on while cooking: UIApplication.idleTimerDisabled.
//
// It's app-wide state, so we restore whatever it was before (the host app
// may have its own reasons to keep the screen on), and reference-count in
// case two screens ask at once. UIApplication is @MainActor: every access goes
// through onMain.
import { useEffect } from "react";
import { native, onMain } from "swiftjsx";
import { capabilities } from "./platform";

let holders = 0;
let previous: boolean | null = null;

async function acquire() {
  holders += 1;
  if (holders > 1) return;
  await onMain(() => {
    const app = native.UIApplication.sharedApplication;
    previous = app.idleTimerDisabled;
    app.idleTimerDisabled = true;
  });
}

async function release() {
  holders = Math.max(0, holders - 1);
  if (holders > 0) return;
  // onMain calls run in order, so this lands after acquire()'s, even when the
  // screen closes before the first one finished.
  await onMain(() => {
    native.UIApplication.sharedApplication.idleTimerDisabled = previous ?? false;
    previous = null;
  });
}

/** While mounted (and `active`), the screen doesn't dim or lock. Returns whether it can. */
export function useKeepAwake(active = true): boolean {
  const supported = capabilities.keepAwake;
  useEffect(() => {
    if (!active || !supported) return;
    acquire().catch((e) => console.warn("keep awake:", e));
    return () => {
      release().catch((e) => console.warn("keep awake (restore):", e));
    };
  }, [active, supported]);
  return supported;
}
