// Sharing and copying. SwiftJSX has no ShareLink and no clipboard API, so
// with the native backend we drive UIKit directly; without it, export falls
// back to mailto: / sms: links (see ExportSheet).
import { native, onMain, isNativeAvailable, type Frame } from "swiftjsx";

export const hasUIKit = () => isNativeAvailable() && "UIActivityViewController" in native;

// The native typings are exact, but walking scenes → windows → presented view
// controllers through NSSet/NSArray is easier untyped.
type Any = any;

function topViewController(): Any {
  const n: Any = native;
  const scenes: Any = n.UIApplication.sharedApplication.connectedScenes.allObjects;
  const count: number = scenes.count ?? scenes.length ?? 0;
  let window: Any = null;
  for (let i = 0; i < count && !window; i++) {
    const scene = scenes.objectAtIndex ? scenes.objectAtIndex(i) : scenes[i];
    window = scene?.keyWindow ?? null;
  }
  let vc: Any = window?.rootViewController;
  while (vc?.presentedViewController) vc = vc.presentedViewController;
  return vc;
}

/**
 * The system share sheet. `anchor` (from `ref.measure()`, window coordinates)
 * is where the iPad popover points.
 */
export function shareText(text: string, anchor?: Frame): Promise<void> {
  return onMain(() => {
    const n: Any = native;
    const vc = topViewController();
    if (!vc) throw new Error("No view controller to present the share sheet from");
    const sheet: Any = n.UIActivityViewController.alloc().initWithActivityItemsApplicationActivities([text], null);
    const popover = sheet.popoverPresentationController;
    if (popover) {
      const window = vc.view.window;
      popover.sourceView = window ?? vc.view;
      popover.sourceRect = anchor
        ? n.CGRectMake(anchor.x, anchor.y, anchor.width, anchor.height)
        : n.CGRectMake(vc.view.bounds.size.width / 2, 80, 1, 1);
    }
    vc.presentViewControllerAnimatedCompletion(sheet, true, null);
  });
}

export function copyText(text: string): Promise<void> {
  return onMain(() => {
    native.UIPasteboard.generalPasteboard.string = text;
  });
}
