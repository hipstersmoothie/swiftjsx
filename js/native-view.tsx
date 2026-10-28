// <NativeView create>: a UIView (NSView on macOS) made with the native
// backend, laid out like any other view (MPVolumeView, AVRoutePickerView, a
// third-party SDK's view).

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Modifiers } from "./components";
import { native, onMain } from "./native";

const NativeViewHost = "NativeView" as unknown as (props: any) => ReactNode;

let nextView = 1;

export type NativeViewProps = Modifiers & {
  /**
   * Makes the view, on the main thread, once per mount. Keep the view (from
   * `onCreate`) to change it later, inside `onMain`.
   */
  create: () => any;
  /** The view, once made (on the main thread). */
  onCreate?: (view: any) => void;
  /**
   * Its size when it has no natural one: "fill" (the default: whatever it's
   * offered) or "fit" (its own fitting size).
   */
  sizing?: "fill" | "fit";
};

/**
 * A native view in the SwiftUI tree. Needs the native backend:
 *
 *   <NativeView create={() => native.AVRoutePickerView.new()} frame={{ width: 44, height: 44 }} />
 */
export function NativeView({ create, onCreate, ...props }: NativeViewProps) {
  const [key, setKey] = useState<string | null>(null);
  const latest = useRef({ create, onCreate });
  useEffect(() => {
    latest.current = { create, onCreate };
  });
  useEffect(() => {
    // Handed to Swift through the main thread's dictionary (both sides see
    // it; only touched on main), under a key in the props.
    const id = `swiftjsx.nativeView.${nextView++}`;
    let live = true;
    onMain(() => {
      const view = latest.current.create();
      native.NSThread.mainThread.threadDictionary.setObjectForKey(view, id as any);
      latest.current.onCreate?.(view);
    }).then(
      () => live && setKey(id),
      (error) => console.error("NativeView create() failed:", error),
    );
    return () => {
      live = false;
      void onMain(() => native.NSThread.mainThread.threadDictionary.removeObjectForKey(id as any)).catch(() => {});
    };
  }, []);
  return <NativeViewHost {...props} viewKey={key} />;
}
