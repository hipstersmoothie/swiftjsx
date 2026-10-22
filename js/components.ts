// Typed handles for the SwiftUI host components. Each one is just a string tag
// that the Swift side knows how to render; the cast gives JSX real prop types.

import type { ReactNode, FC, Ref } from "react";
import type { HostInstance } from "./renderer";

export type Color =
  | "primary" | "secondary" | "accent" | "red" | "orange" | "yellow" | "green"
  | "mint" | "teal" | "cyan" | "blue" | "indigo" | "purple" | "pink" | "brown"
  | "gray" | "black" | "white" | "clear"
  | `#${string}`;

export type Font =
  | "largeTitle" | "title" | "title2" | "title3" | "headline" | "subheadline"
  | "body" | "callout" | "footnote" | "caption" | "caption2";

export type Dimension = number | "infinity";

/**
 * SwiftUI modifiers, as props. They're applied in a fixed, CSS-box-model-ish
 * order: padding → frame → background → cornerRadius → border → shadow →
 * opacity. So `padding` is *inside* `background`, like on the web.
 */
export interface Modifiers {
  padding?: number | boolean | { top?: number; leading?: number; bottom?: number; trailing?: number; horizontal?: number; vertical?: number };
  frame?: { width?: number; height?: number; minWidth?: number; maxWidth?: Dimension; minHeight?: number; maxHeight?: Dimension; alignment?: Alignment };
  background?: Color;
  foregroundStyle?: Color;
  font?: Font;
  fontWeight?: "ultraLight" | "thin" | "light" | "regular" | "medium" | "semibold" | "bold" | "heavy" | "black";
  fontDesign?: "default" | "rounded" | "monospaced" | "serif";
  cornerRadius?: number;
  border?: { color: Color; width?: number };
  shadow?: number | { radius: number; x?: number; y?: number; color?: Color };
  opacity?: number;
  disabled?: boolean;
  /** Animate changes to this view with SwiftUI's default spring. */
  animation?: "default" | "spring" | "bouncy" | "easeInOut" | "linear";
  /** Like `key`, but for SwiftUI transitions when the view is inserted/removed. */
  transition?: "opacity" | "scale" | "slide" | "move";
  onAppear?: () => void;
  onTapGesture?: () => void;
  /** Imperative handle: `focus()`, `blur()`, `scrollTo()`, `measure()`. */
  ref?: Ref<HostInstance>;
}

type Alignment = "leading" | "center" | "trailing" | "top" | "bottom" | "topLeading" | "topTrailing" | "bottomLeading" | "bottomTrailing";

type WithChildren = { children?: ReactNode };
const host = <P,>(tag: string) => tag as unknown as FC<P>;

export const VStack = host<Modifiers & WithChildren & { spacing?: number; alignment?: "leading" | "center" | "trailing" }>("VStack");
export const HStack = host<Modifiers & WithChildren & { spacing?: number; alignment?: "top" | "center" | "bottom" | "firstTextBaseline" }>("HStack");
export const ZStack = host<Modifiers & WithChildren & { alignment?: Alignment }>("ZStack");
export const ScrollView = host<Modifiers & WithChildren & { axis?: "vertical" | "horizontal" }>("ScrollView");
export const List = host<Modifiers & WithChildren>("List");
export const Form = host<Modifiers & WithChildren>("Form");
export const Section = host<Modifiers & WithChildren & { header?: string; footer?: string }>("Section");

export const Text = host<Modifiers & WithChildren & { strikethrough?: boolean; italic?: boolean; monospacedDigit?: boolean }>("Text");
export const Image = host<Modifiers & { systemName: string; resizable?: boolean; scale?: "small" | "medium" | "large" }>("Image");
export const Label = host<Modifiers & { title: string; systemImage: string }>("Label");
export const Spacer = host<Modifiers & { minLength?: number }>("Spacer");
export const Divider = host<Modifiers>("Divider");
export const ProgressView = host<Modifiers & { value?: number; total?: number; label?: string }>("ProgressView");

export const Button = host<
  Modifiers & WithChildren & {
    onPress: () => void;
    title?: string;
    role?: "destructive" | "cancel";
    buttonStyle?: "automatic" | "bordered" | "borderedProminent" | "borderless" | "plain";
  }
>("Button");

export const TextField = host<
  Modifiers & {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onSubmit?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
    secure?: boolean;
  }
>("TextField");
export const Toggle = host<Modifiers & WithChildren & { value: boolean; onChange: (value: boolean) => void; label?: string }>("Toggle");
export const Slider = host<Modifiers & { value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number }>("Slider");
export const Stepper = host<Modifiers & WithChildren & { value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number; label?: string }>("Stepper");
export const Picker = host<Modifiers & { value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; label?: string; pickerStyle?: "menu" | "segmented" | "inline" }>("Picker");

// MARK: Lazy containers. SwiftUI only builds the views that are on screen, but
// React still renders every child; for thousands of rows use <VirtualList>.

export const LazyVStack = host<Modifiers & WithChildren & { spacing?: number; alignment?: "leading" | "center" | "trailing" }>("LazyVStack");
export const LazyHStack = host<Modifiers & WithChildren & { spacing?: number; alignment?: "top" | "center" | "bottom" }>("LazyHStack");
/** `columns` is a fixed count, or `{ minimum }` for as many as fit (adaptive). */
export const LazyVGrid = host<Modifiers & WithChildren & { columns: number | { minimum: number; maximum?: number }; spacing?: number }>("LazyVGrid");

// MARK: Navigation & presentation

/**
 * Low-level stack: the first child is the root screen, every further child is
 * pushed on top. When the user navigates back, `onPathChange(n)` reports how
 * many pushed screens remain; drop the rest from state. Most apps want
 * `<Navigator>` + `useNavigation()` instead.
 */
export const NavigationStack = host<Modifiers & WithChildren & { onPathChange?: (depth: number) => void }>("NavigationStack");

/** One screen in a NavigationStack (groups a component's output into one page). */
export const NavigationPage = host<WithChildren>("NavigationPage");

/** Sets the navigation title and toolbar for whatever screen it's rendered in. */
export const Screen = host<Modifiers & WithChildren & { title?: string; titleDisplayMode?: "automatic" | "inline" | "large" }>("Screen");

export const ToolbarItem = host<WithChildren & { placement?: "automatic" | "primaryAction" | "cancellationAction" | "confirmationAction" | "principal" | "navigation" }>("ToolbarItem");

export const Sheet = host<
  WithChildren & {
    isPresented: boolean;
    /** Called when the user dismisses it (swipe down, Esc…); set your state to false. */
    onDismiss: () => void;
    detents?: ("medium" | "large" | number)[];
    /** iOS: cover the whole screen instead of a card. */
    fullScreen?: boolean;
  }
>("Sheet");

/** Children should be <Button>s; tapping any one dismisses the alert. */
export const Alert = host<WithChildren & { isPresented: boolean; onDismiss: () => void; title: string; message?: string }>("Alert");
/**
 * Presentations attach to their parent element. On iOS 26+ a confirmation
 * dialog is a popover pointing at that element, so nest it inside the button
 * that opens it: `<Button title="Share" onPress={open}><ConfirmationDialog …/></Button>`.
 */
export const ConfirmationDialog = host<WithChildren & { isPresented: boolean; onDismiss: () => void; title: string; message?: string }>("ConfirmationDialog");
