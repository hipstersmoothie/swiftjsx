// Sheet, Alert and ConfirmationDialog: presented with `isPresented`, or with
// an `item` (presented while it's non-null; the children get it), like
// SwiftUI's `sheet(item:)`. Two things a plain boolean gets wrong:
//  - while dismissing, the content keeps showing the last item instead of
//    going blank when your state is cleared;
//  - each presentation starts fresh (children remount), so a form in a sheet
//    doesn't carry over what was typed last time. `keepState` opts out.
// A sheet's content unmounts once it has gone (its effects stop), unless
// `keepState`.

import { useState, type ReactNode } from "react";
import { SheetHost, AlertHost, ConfirmationDialogHost, type Fill } from "./components";

type Presentable<T> = {
  /** Called when the user dismisses it (swipe down, a button…): clear your state. */
  onDismiss: () => void;
} & (
  | { isPresented: boolean; item?: undefined; children?: ReactNode }
  | { item: T | null | undefined; isPresented?: undefined; children: (item: T) => ReactNode }
);

/** Shared presentation state: whether it's up, the item to show, and a key per presentation. */
function usePresentation<T>(props: Presentable<T>) {
  const presented = props.item !== undefined ? props.item !== null : !!props.isPresented;
  const [shown, setShown] = useState<T | null | undefined>(props.item);
  const [wasPresented, setWasPresented] = useState(presented);
  const [generation, setGeneration] = useState(0);
  // Derived from props during render (React's "adjusting state when a prop changes").
  if (props.item != null && props.item !== shown) setShown(props.item);
  if (presented !== wasPresented) {
    setWasPresented(presented);
    if (presented) setGeneration((g) => g + 1);
  }
  const content =
    typeof props.children === "function" ? (shown != null ? (props.children as (item: T) => ReactNode)(shown as T) : null) : props.children;
  return { presented, shown, generation, content };
}

type SheetProps<T> = Presentable<T> & {
  detents?: ("medium" | "large" | number)[];
  /** iOS: cover the whole screen instead of a card. */
  fullScreen?: boolean;
  /** Refuse the swipe down (e.g. while there are unsaved changes; offer Cancel instead). */
  interactiveDismissDisabled?: boolean;
  dragIndicator?: "automatic" | "visible" | "hidden";
  cornerRadius?: number;
  background?: Fill;
  /** Keep the content's state between presentations (default: start fresh, like SwiftUI). */
  keepState?: boolean;
  /** After the sheet has gone (its dismiss animation finished). */
  onDismissed?: () => void;
  /**
   * The user swiped down while the sheet can't be dismissed
   * (`interactiveDismissDisabled`, here or inside it): ask "Discard changes?".
   */
  onDismissAttempt?: () => void;
};

export function Sheet<T>(props: SheetProps<T>) {
  const { presented, generation, content } = usePresentation(props);
  // Mounted from presentation until the sheet has animated away.
  const [mounted, setMounted] = useState(presented);
  if (presented && !mounted) setMounted(true);
  return (
    <SheetHost
      isPresented={presented}
      onDismiss={props.onDismiss}
      onDismissAttempt={props.onDismissAttempt}
      onDismissed={() => {
        if (!presented) setMounted(false);
        props.onDismissed?.();
      }}
      detents={props.detents}
      fullScreen={props.fullScreen}
      interactiveDismissDisabled={props.interactiveDismissDisabled}
      dragIndicator={props.dragIndicator}
      cornerRadius={props.cornerRadius}
      background={props.background}
    >
      {mounted || props.keepState ? <Fresh key={props.keepState ? 0 : generation}>{content}</Fresh> : null}
    </SheetHost>
  );
}

type DialogProps<T> = Presentable<T> & {
  title: string | ((item: T) => string);
  message?: string | ((item: T) => string);
};

function useDialog<T>(props: DialogProps<T>) {
  const presentation = usePresentation(props);
  const resolve = (value: string | ((item: T) => string) | undefined) =>
    typeof value === "function" ? (presentation.shown != null ? value(presentation.shown as T) : "") : value;
  return { ...presentation, title: resolve(props.title) ?? "", message: resolve(props.message) };
}

/** Children should be <Button>s; tapping any one dismisses the alert. */
export function Alert<T>(props: DialogProps<T>) {
  const { presented, title, message, content } = useDialog(props);
  return (
    <AlertHost isPresented={presented} onDismiss={props.onDismiss} title={title} message={message}>
      {content}
    </AlertHost>
  );
}

/**
 * Presentations attach to their parent element. On iOS 26+ a confirmation
 * dialog is a popover pointing at that element, so nest it inside the button
 * that opens it: `<Button title="Share" onPress={open}><ConfirmationDialog …/></Button>`.
 */
export function ConfirmationDialog<T>(props: DialogProps<T>) {
  const { presented, title, message, content } = useDialog(props);
  return (
    <ConfirmationDialogHost isPresented={presented} onDismiss={props.onDismiss} title={title} message={message}>
      {content}
    </ConfirmationDialogHost>
  );
}

/** A keyed boundary: changing the key remounts the content. */
function Fresh({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
