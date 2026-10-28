// What this runtime can do natively. Every feature is optional: without the
// native backend (or on macOS, where there's no UIApplication), the app falls
// back to in-app behavior and says so.
import { native, isNativeAvailable } from "swiftjsx";

const has = (name: string) => {
  try {
    return isNativeAvailable() && name in native;
  } catch {
    return false;
  }
};

/**
 * UNUserNotificationCenter throws an Objective-C exception (and takes the
 * process down) when the process isn't an app bundle, e.g. `swift run Demo`.
 */
function isAppBundle(): boolean {
  try {
    const bundle = native.NSBundle.mainBundle;
    return !!bundle.bundleIdentifier && String(bundle.bundlePath).endsWith(".app");
  } catch {
    return false;
  }
}

export const capabilities = {
  /** UIApplication.idleTimerDisabled (iOS). */
  get keepAwake() {
    return has("UIApplication");
  },
  /** AVSpeechSynthesizer (iOS and macOS). */
  get speech() {
    return has("AVSpeechSynthesizer") && has("NativeClass");
  },
  /** Local notifications (UserNotifications, inside an app bundle). */
  get notifications() {
    return has("UNUserNotificationCenter") && isAppBundle();
  },
};

/**
 * From a native callback (main thread, or a background queue for most
 * completion handlers) back to the JS thread, where React and zustand live.
 */
export const toJS = (fn: () => void) => {
  setTimeout(fn, 0);
};
