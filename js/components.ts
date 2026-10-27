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

/** SwiftUI materials: translucent, blurred backgrounds. */
export type Material = "ultraThinMaterial" | "thinMaterial" | "regularMaterial" | "thickMaterial" | "ultraThickMaterial" | "bar";

/**
 * SwiftUI modifiers, as props. They're applied in a fixed, CSS-box-model-ish
 * order: padding → frame → background → cornerRadius → border → shadow →
 * opacity. So `padding` is *inside* `background`, like on the web.
 */
export interface Modifiers {
  padding?: number | boolean | { top?: number; leading?: number; bottom?: number; trailing?: number; horizontal?: number; vertical?: number };
  frame?: { width?: number; height?: number; minWidth?: number; maxWidth?: Dimension; minHeight?: number; maxHeight?: Dimension; alignment?: Alignment };
  /** A color, a material, or a linear gradient (top to bottom unless `start`/`end` say otherwise). */
  background?: Color | Material | { gradient: Color[]; start?: Alignment; end?: Alignment };
  foregroundStyle?: Color;
  font?: Font;
  fontWeight?: "ultraLight" | "thin" | "light" | "regular" | "medium" | "semibold" | "bold" | "heavy" | "black";
  fontDesign?: "default" | "rounded" | "monospaced" | "serif";
  cornerRadius?: number;
  border?: { color: Color; width?: number };
  shadow?: number | { radius: number; x?: number; y?: number; color?: Color };
  opacity?: number;
  disabled?: boolean;
  /** Animate every change to this view (and its children's insertions/removals). */
  animation?: AnimationSpec;
  /** Like `key`, but for SwiftUI transitions when the view is inserted/removed. */
  transition?: "opacity" | "scale" | "slide" | "move";
  onAppear?: () => void;
  /**
   * Pull to refresh, on a List, ScrollView or VirtualList (or a view around
   * one). Return a promise: the spinner stays until it settles.
   */
  onRefresh?: () => void | Promise<unknown>;

  // Transforms, applied after the box (background, border, shadow) like CSS.
  /** Move the view without affecting layout, in points. */
  offset?: { x?: number; y?: number };
  scale?: number;
  /** Degrees, clockwise. */
  rotation?: number;

  // Gestures. Handlers run on the JS thread; state you set re-renders as usual.
  onTapGesture?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  /** Seconds before `onLongPress` fires (default 0.5). */
  longPressDuration?: number;
  /** While dragging. Inside a ScrollView a drag takes over scrolling. */
  onDrag?: (event: DragEvent) => void;
  onDragEnd?: (event: DragEvent) => void;
  /** Points the finger moves before a drag starts (default 10). */
  dragMinimumDistance?: number;
  /** Pinch; `scale` is relative to the start of the gesture. */
  onMagnify?: (event: { scale: number }) => void;
  onMagnifyEnd?: (event: { scale: number }) => void;
  /** Two-finger rotation, in degrees since the start of the gesture. */
  onRotate?: (event: { degrees: number }) => void;
  onRotateEnd?: (event: { degrees: number }) => void;

  // Accessibility (VoiceOver, Voice Control, UI tests).
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityValue?: string;
  accessibilityHidden?: boolean;
  /** For UI tests (XCUITest), like `testID` in React Native. */
  accessibilityIdentifier?: string;
  accessibilityTraits?: AccessibilityTrait | AccessibilityTrait[];
  /** Higher is read first. */
  accessibilitySortPriority?: number;
  /** "combine": read the children as one element; "ignore": hide them (set a label); "contain": a container. */
  accessibilityElement?: "combine" | "ignore" | "contain";

  /**
   * Props computed on the main thread from shared values (`useAnimatedStyle`).
   * They override this element's props with the same name.
   */
  animatedStyle?: import("./worklets").AnimatedStyle;
  /** Imperative handle: `focus()`, `blur()`, `scrollTo()`, `measure()`. */
  ref?: Ref<HostInstance>;
}

export type AnimationCurve = "default" | "spring" | "bouncy" | "snappy" | "smooth" | "easeInOut" | "easeIn" | "easeOut" | "linear";
/** A SwiftUI animation: a curve name, or a curve with options. Durations are in seconds. */
export type AnimationSpec =
  | AnimationCurve
  | {
      type: AnimationCurve;
      duration?: number;
      /** Springs: 0 = no overshoot, up to ~1 = very bouncy. */
      bounce?: number;
      delay?: number;
      speed?: number;
      repeatCount?: number;
      repeatForever?: boolean;
      autoreverses?: boolean;
    };

type Point = { x: number; y: number };
/** Positions are in window coordinates; `translation` is from where the drag started. */
export type DragEvent = { translation: Point; location: Point; startLocation: Point; velocity: Point; predictedEndTranslation: Point };

export type AccessibilityTrait =
  | "button" | "header" | "link" | "image" | "selected" | "staticText" | "searchField" | "summaryElement"
  | "updatesFrequently" | "toggle" | "modal" | "playsSound" | "startsMediaSession" | "allowsDirectInteraction";

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

export const Text = host<
  Modifiers & WithChildren & {
    strikethrough?: boolean;
    italic?: boolean;
    monospacedDigit?: boolean;
    /** Maximum lines; the rest is truncated with "…". */
    lineLimit?: number;
    /** Alignment of wrapped lines. */
    textAlignment?: "leading" | "center" | "trailing";
  }
>("Text");
type ImageSource =
  /** An SF Symbol. Sized like text unless `resizable`. */
  | { systemName: string; resizable?: boolean; imageScale?: "small" | "medium" | "large"; contentMode?: "fit" | "fill" }
  /** An image from the app's asset catalog; resizable. */
  | { name: string; contentMode?: "fit" | "fill" }
  /**
   * A URL (https:, file:, data:), loaded with a memory cache and decoded off
   * the main thread; resizable. Give it a `frame`. Shows a placeholder while loading.
   */
  | {
      src: string;
      contentMode?: "fit" | "fill";
      onLoad?: (size: { width: number; height: number }) => void;
      onError?: (error: { message: string }) => void;
    };
export const Image = host<Modifiers & ImageSource>("Image");
export const Label = host<Modifiers & { title: string; systemImage: string }>("Label");
export const Spacer = host<Modifiers & { minLength?: number }>("Spacer");
export const Divider = host<Modifiers>("Divider");
export const ProgressView = host<Modifiers & { value?: number; total?: number; label?: string; tint?: Color }>("ProgressView");

export const Button = host<
  Modifiers & WithChildren & {
    onPress: () => void;
    title?: string;
    role?: "destructive" | "cancel";
    buttonStyle?: "automatic" | "bordered" | "borderedProminent" | "borderless" | "plain";
    /** Accent color of the button (and its background in `<SwipeActions>`). */
    tint?: Color;
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
export const Toggle = host<Modifiers & WithChildren & { value: boolean; onChange: (value: boolean) => void; label?: string; tint?: Color }>("Toggle");
export const Slider = host<Modifiers & { value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number; tint?: Color }>("Slider");
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

/**
 * Tabs. Each `<Tab>` child is a tab; its `value` (default: its position as a
 * string) is what `selection` / `onSelectionChange` use. Leave out `selection`
 * for an uncontrolled tab view. `tabViewStyle="page"` makes a swipeable pager.
 */
export const TabView = host<
  Modifiers & WithChildren & {
    selection?: string;
    onSelectionChange?: (value: string) => void;
    tabViewStyle?: "automatic" | "sidebarAdaptable" | "page";
  }
>("TabView");

/** One tab of a TabView. Put a `<Navigator>` inside for a stack per tab. */
export const Tab = host<
  WithChildren & {
    title?: string;
    systemImage?: string;
    value?: string | number;
    /** A number (0 hides it) or a short string. */
    badge?: number | string;
    /** "search": the separate search tab of iOS 26. */
    role?: "search";
  }
>("Tab");

/** One screen in a NavigationStack (groups a component's output into one page). */
export const NavigationPage = host<WithChildren>("NavigationPage");

/** A column of a NavigationSplitView (see `NavigationSplitView` in navigation.tsx). */
export const SplitColumn = host<WithChildren & { column: "sidebar" | "content" | "detail" }>("SplitColumn");
export const NavigationSplitViewHost = host<
  Modifiers & WithChildren & {
    preferredCompactColumn?: "sidebar" | "content" | "detail";
    onPreferredCompactColumnChange?: (column: "sidebar" | "content" | "detail") => void;
    navigationSplitViewStyle?: "automatic" | "balanced" | "prominentDetail";
  }
>("NavigationSplitView");

/** Sets the navigation title and toolbar for whatever screen it's rendered in. */
export const Screen = host<
  Modifiers & WithChildren & {
    title?: string;
    titleDisplayMode?: "automatic" | "inline" | "large";
    /** A search field in the navigation bar (controlled with `onSearchTextChange`). */
    searchText?: string;
    onSearchTextChange?: (text: string) => void;
    searchPrompt?: string;
  }
>("Screen");

/**
 * Buttons revealed by swiping a row of a `<List>` (put it inside the row).
 * Give buttons `tint` or `role="destructive"` for their color.
 */
export const SwipeActions = host<WithChildren & { edge?: "leading" | "trailing"; allowsFullSwipe?: boolean }>("SwipeActions");

/** Buttons shown when the parent element is long-pressed. */
export const ContextMenu = host<WithChildren>("ContextMenu");

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
