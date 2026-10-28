// Local notifications for kitchen timers, so a timer still rings when the app
// is in the background (or the phone is locked): UNUserNotificationCenter
// with a time-interval trigger, one request per timer, removed when the timer
// is stopped or paused.
//
// UNUserNotificationCenter isn't main-thread-only, so we call it from the JS
// thread. Its completion handlers run on a background queue (under the VM
// lock): they only copy values out and hop back with toJS before resolving.
import { native } from "swiftjsx";
import { capabilities, toJS } from "./platform";

export type NotificationPermission = "unavailable" | "notDetermined" | "denied" | "granted";

const center = () => native.UNUserNotificationCenter.currentNotificationCenter();
const requestId = (timerId: string) => `recipes.timer.${timerId}`;

function statusName(status: number): NotificationPermission {
  const S = native.UNAuthorizationStatus;
  if (status === S.NotDetermined) return "notDetermined";
  if (status === S.Denied) return "denied";
  // Authorized, Provisional, Ephemeral all deliver.
  return "granted";
}

export function getPermission(): Promise<NotificationPermission> {
  if (!capabilities.notifications) return Promise.resolve("unavailable");
  return new Promise((resolve) => {
    center().getNotificationSettingsWithCompletionHandler((settings) => {
      const status = Number(settings.authorizationStatus);
      toJS(() => resolve(statusName(status)));
    });
  });
}

/** Asks once (iOS shows the prompt only the first time); afterwards reports the user's choice. */
export async function requestPermission(): Promise<NotificationPermission> {
  const current = await getPermission();
  if (current !== "notDetermined") return current;
  const O = native.UNAuthorizationOptions;
  return new Promise((resolve) => {
    center().requestAuthorizationWithOptionsCompletionHandler(O.Alert | O.Sound, (granted, error) => {
      // Typed non-null, but `error` is nil on success.
      const message = (error as typeof error | null)?.localizedDescription;
      toJS(() => {
        if (message) console.warn("notification permission:", message);
        resolve(granted ? "granted" : "denied");
      });
    });
  });
}

/** Schedules (or reschedules: same id replaces) the notification for a timer. */
export function scheduleTimerNotification(timerId: string, seconds: number, title: string, body: string): Promise<void> {
  if (!capabilities.notifications) return Promise.resolve();
  const n = native;
  const content = n.UNMutableNotificationContent.new();
  content.title = title;
  content.body = body;
  content.sound = n.UNNotificationSound.defaultSound;
  content.threadIdentifier = "recipes.timers";
  // Time-sensitive breaks through Focus, but needs an entitlement; Active is the default.
  content.interruptionLevel = n.UNNotificationInterruptionLevel.Active;
  // The trigger needs at least a second.
  const trigger = n.UNTimeIntervalNotificationTrigger.triggerWithTimeIntervalRepeats(Math.max(1, Math.round(seconds)), false);
  const request = n.UNNotificationRequest.requestWithIdentifierContentTrigger(requestId(timerId), content, trigger);
  return new Promise((resolve, reject) => {
    center().addNotificationRequestWithCompletionHandler(request, (error) => {
      const message = (error as typeof error | null)?.localizedDescription;
      toJS(() => (message ? reject(new Error(message)) : resolve()));
    });
  });
}

export function cancelTimerNotification(timerId: string) {
  if (!capabilities.notifications) return;
  const c = center();
  const ids = [requestId(timerId)];
  c.removePendingNotificationRequestsWithIdentifiers(ids);
  c.removeDeliveredNotificationsWithIdentifiers(ids);
}
