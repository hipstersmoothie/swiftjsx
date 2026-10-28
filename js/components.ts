// Typed handles for the SwiftUI host components. Each one is just a string tag
// that the Swift side knows how to render; the cast gives JSX real prop types.

import type { ReactNode, FC, Ref } from "react";
import type { HostInstance } from "./renderer";

type NamedColor =
  | "primary" | "secondary" | "accent" | "red" | "orange" | "yellow" | "green"
  | "mint" | "teal" | "cyan" | "blue" | "indigo" | "purple" | "pink" | "brown"
  | "gray" | "black" | "white" | "clear"
  // iOS semantic colors: adapt to light and dark mode.
  | "systemBackground" | "secondarySystemBackground" | "tertiarySystemBackground"
  | "systemGroupedBackground" | "secondarySystemGroupedBackground" | "tertiarySystemGroupedBackground"
  | "systemFill" | "secondarySystemFill" | "tertiarySystemFill" | "quaternarySystemFill"
  | "label" | "secondaryLabel" | "tertiaryLabel" | "quaternaryLabel" | "placeholderText"
  | "separator" | "opaqueSeparator" | "link"
  | "systemGray" | "systemGray2" | "systemGray3" | "systemGray4" | "systemGray5" | "systemGray6";

/**
 * A color: a name, hex (`#rgb`, `#rrggbb`, `#rrggbbaa`), either with `/NN`
 * for NN% opacity (`"blue/20"`, like Tailwind).
 */
export type Color = NamedColor | `${NamedColor}/${number}` | `#${string}`;

/** A color, or a pair for light and dark mode. */
export type ColorValue = Color | { light: Color; dark: Color };

/** A gradient. Stops are evenly spaced unless given a `location` (0–1). */
export type Gradient = {
  gradient: (ColorValue | { color: ColorValue; location: number })[];
  /** Default "linear", from `start` (top) to `end` (bottom). */
  type?: "linear" | "radial" | "angular";
  /** An alignment, or a unit point (`{ x: 0, y: 0.5 }` is the leading middle). */
  start?: Alignment | UnitPoint;
  end?: Alignment | UnitPoint;
  /** Radial and angular gradients. */
  center?: Alignment | UnitPoint;
  startRadius?: number;
  endRadius?: number;
  /**
   * Angular gradients: degrees clockwise from the trailing side (default 0
   * and `startAngle + 360`). Less than a full turn for an arc, e.g. a gauge
   * from 135 to 405.
   */
  startAngle?: number;
  endAngle?: number;
};

/** 0…1 across and down. */
export type UnitPoint = { x: number; y: number };

/**
 * What `foregroundStyle`, `background` and shape `fill`/`stroke` take: a
 * color, a material, a gradient, or (for foregrounds) a level of the current
 * style: "secondary" … "quinary" are dimmer versions of whatever color the
 * text would have, like in SwiftUI (gray on white, translucent white on blue).
 */
export type Fill = ColorValue | Material | Gradient | "tertiary" | "quaternary" | "quinary";

export type TextStyle =
  | "largeTitle" | "title" | "title2" | "title3" | "headline" | "subheadline"
  | "body" | "callout" | "footnote" | "caption" | "caption2";

type FontWeight = "ultraLight" | "thin" | "light" | "regular" | "medium" | "semibold" | "bold" | "heavy" | "black";
type FontDesign = "default" | "rounded" | "monospaced" | "serif";

/**
 * A text style, or a font: `{ size: 96, weight: "thin" }` (a fixed-size
 * system font), or `{ name: "Avenir Next", size: 20, relativeTo: "title3" }`
 * (a custom font that scales with Dynamic Type).
 */
export type Font =
  | TextStyle
  | {
      size?: number;
      weight?: FontWeight;
      design?: FontDesign;
      width?: "compressed" | "condensed" | "standard" | "expanded";
      /** A font installed or bundled with the app (by PostScript or family name). */
      name?: string;
      /** The text style a custom font scales with (default "body"). */
      relativeTo?: TextStyle;
    };

/** A radius for every corner, "capsule" (fully rounded ends), or one per corner. */
export type CornerRadius = number | "capsule" | { topLeading?: number; topTrailing?: number; bottomLeading?: number; bottomTrailing?: number };

export type Dimension = number | "infinity";

/** SwiftUI materials: translucent, blurred backgrounds. */
export type Material = "ultraThinMaterial" | "thinMaterial" | "regularMaterial" | "thickMaterial" | "ultraThickMaterial" | "bar";

/**
 * SwiftUI modifiers, as props. They're applied in a fixed, CSS-box-model-ish
 * order: padding → frame → background → cornerRadius → border → shadow →
 * opacity. So `padding` is *inside* `background`, like on the web.
 */
export type SafeAreaEdge = "top" | "bottom" | "leading" | "trailing" | "horizontal" | "vertical" | "all";
export type TransitionName = "opacity" | "scale" | "slide" | "move" | "push" | "offset" | "blur" | "identity";
export type TransitionSpec =
  | TransitionName
  | {
      type: TransitionName;
      /** move / push: where it comes from and goes to. */
      edge?: "top" | "bottom" | "leading" | "trailing";
      /** scale: the size it starts from (default 0), around `anchor`. */
      scale?: number;
      anchor?: "center" | "top" | "bottom" | "leading" | "trailing" | "topLeading" | "topTrailing" | "bottomLeading" | "bottomTrailing";
      /** offset: where it starts from, in points. */
      x?: number;
      y?: number;
      /** The transition's own animation, whatever its parent's. */
      animation?: AnimationSpec;
    };

export interface Modifiers {
  padding?: number | boolean | { top?: number; leading?: number; bottom?: number; trailing?: number; horizontal?: number; vertical?: number };
  frame?: { width?: number; height?: number; minWidth?: number; maxWidth?: Dimension; minHeight?: number; maxHeight?: Dimension; alignment?: Alignment };
  /** A color, a material or a gradient behind the view (inside its padding). */
  background?: Fill;
  /** Color (or gradient…) of text, symbols and shapes inside. */
  foregroundStyle?: Fill;
  font?: Font;
  fontWeight?: FontWeight;
  fontDesign?: FontDesign;
  /**
   * Rounds the background and border, and clips the content (except on a
   * material background, where clipping would turn off vibrancy).
   */
  cornerRadius?: CornerRadius;
  /** Drawn inside the view's edge, following `cornerRadius`. */
  border?: { color: Fill; width?: number };
  shadow?: number | { radius: number; x?: number; y?: number; color?: ColorValue };
  /** Light or dark appearance for this view and everything inside it. */
  colorScheme?: "light" | "dark";
  /** Drawing order among siblings (higher is in front). */
  zIndex?: number;
  /** Accent color for every control inside (buttons, toggles, links…), like SwiftUI's `.tint`. */
  tint?: ColorValue;
  /** Light or dark for the whole screen or sheet this view is in (unlike `colorScheme`, which is just this subtree). */
  preferredColorScheme?: "light" | "dark";
  /** Width / height (e.g. 1 for square, 16 / 9), fitting the space offered, or `{ ratio, contentMode: "fill" }`. */
  aspectRatio?: number | { ratio?: number; contentMode?: "fit" | "fill" };
  /** Take the ideal size instead of the offered one (no truncation): true, or one axis. */
  fixedSize?: boolean | "horizontal" | "vertical";
  /** false: touches pass through to what's behind (like CSS `pointer-events: none`). */
  allowsHitTesting?: boolean;
  /** Who gets space first in a stack (higher wins; default 0). */
  layoutPriority?: number;
  /** In a `<GridRow>`: how many columns this cell spans. */
  gridColumns?: number;
  /** The tappable area: the whole shape, not just what's drawn (e.g. a row with a Spacer). */
  contentShape?: "rectangle" | "capsule" | "circle";
  /** Called with the view's size after layout, and when it changes (like React Native's onLayout). */
  onLayout?: (size: { width: number; height: number }) => void;
  /** A fraction of the nearest container's width / height (the scroll view or screen), e.g. 0.8. */
  relativeWidth?: number;
  relativeHeight?: number;
  // Inside a <List>:
  listRowBackground?: Fill;
  listRowInsets?: number | { top?: number; leading?: number; bottom?: number; trailing?: number; horizontal?: number; vertical?: number };
  listRowSeparator?: "visible" | "hidden";
  /** A count or short text shown at the trailing edge of a List row. */
  badge?: number | string;
  /** This row's value for `<List selection>`. */
  tag?: string;
  /** Show as gray placeholder shapes (skeleton loading) instead of the real text and images. */
  redacted?: boolean;
  opacity?: number;
  disabled?: boolean;
  /** Animate every change to this view (and its children's insertions/removals). */
  animation?: AnimationSpec;
  /**
   * How the view comes in and goes out (with an animated commit, or its own
   * `animation`). An object sets options, or `{ insert, remove }` differs
   * each way: `{ insert: { type: "scale", animation: "bouncy" }, remove: "opacity" }`.
   */
  transition?: TransitionSpec | { insert?: TransitionSpec; remove?: TransitionSpec };
  onAppear?: () => void;
  onDisappear?: () => void;
  /** Invisible but still laid out (like CSS `visibility: hidden`). */
  hidden?: boolean;
  /**
   * Pull to refresh, on a List, ScrollView or VirtualList (or a view around
   * one). Return a promise: the spinner stays until it settles.
   */
  onRefresh?: () => void | Promise<unknown>;

  // Transforms, applied after the box (background, border, shadow) like CSS.
  /** Move the view without affecting layout, in points. */
  offset?: { x?: number; y?: number };
  scale?: number;
  /** Stretch one axis (multiplied with `scale`). */
  scaleX?: number;
  scaleY?: number;
  /** Degrees, clockwise. */
  rotation?: number;
  /** Rotation around an axis in 3D (card flips: `{ degrees: 180, axis: { y: 1 } }`); `perspective` 0–1. */
  rotation3D?: { degrees: number; axis?: { x?: number; y?: number; z?: number }; perspective?: number };
  /** The point scale and rotations happen around (default "center"). */
  transformAnchor?: "center" | "top" | "bottom" | "leading" | "trailing" | "topLeading" | "topTrailing" | "bottomLeading" | "bottomTrailing";
  /**
   * A sequence of steps that plays whenever `trigger` changes (or forever with
   * `repeat`), then settles back: a pop `[{ scale: 1.25 }, { scale: 1 }]`, a shake
   * `[{ x: -8 }, { x: 8 }, { x: -4 }, { x: 0 }]`. Each step's `animation` or
   * `duration` (seconds) gets it there; `settle` is the way back.
   */
  /**
   * With `animation`: animate only the commits where this value changes
   * (SwiftUI's `.animation(_:value:)`); other updates apply at once.
   */
  animationKey?: string | number | boolean | null;
  /**
   * Mount like this, then animate to the real props as the view appears
   * (a card sliding up into place, a badge popping in):
   * `initial={{ opacity: 0, y: 20 }}`. Uses `initialAnimation`, else `animation`.
   */
  initial?: { opacity?: number; scale?: number; x?: number; y?: number; rotation?: number };
  initialAnimation?: AnimationSpec;
  keyframes?: {
    trigger?: unknown;
    steps: { scale?: number; opacity?: number; x?: number; y?: number; rotation?: number; duration?: number; animation?: AnimationSpec }[];
    repeat?: boolean;
    settle?: AnimationSpec;
  };

  // Gestures. Handlers run on the JS thread; state you set re-renders as usual.
  /** With where the tap landed, in the view's own coordinates. */
  onTapGesture?: (location: Point) => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  /** Seconds before `onLongPress` fires (default 0.5). */
  longPressDuration?: number;
  /**
   * The finger went down / lifted (hold to pause). Alongside the view's
   * other gestures and scrolling; `cancelled` when the finger moved away (a
   * scroll started) instead of lifting.
   */
  onPressIn?: () => void;
  onPressOut?: (event: { cancelled: boolean }) => void;
  /** While the finger is down. */
  pressedScale?: number;
  pressedOpacity?: number;
  /** While dragging. Inside a ScrollView a drag takes over scrolling. */
  onDrag?: (event: DragEvent) => void;
  /** When the finger lifts; `cancelled` if the system cancelled the drag (positions are the last ones seen). */
  onDragEnd?: (event: DragEvent & { cancelled?: boolean }) => void;
  /**
   * Only drag along this axis (iOS): a drag the other way is left to the
   * surrounding ScrollView, so a horizontally swipeable card in a vertical list
   * still scrolls the list.
   */
  dragAxis?: "horizontal" | "vertical";
  /** "longPress": hold (`longPressDuration`) before dragging; `onDragStart` fires when picked up. */
  dragActivation?: "immediate" | "longPress";
  /**
   * A drag began: with the first movement (and its event), or with
   * `dragActivation="longPress"` when the hold completes (no event).
   */
  onDragStart?: (event?: DragEvent) => void;
  /**
   * Hardware keyboard keys (iPad keyboards, Mac). The view takes focus when it
   * appears. Key names follow the web: "ArrowUp", "Enter", "Escape", "a"…
   */
  onKeyPress?: (event: { key: string; characters: string; modifiers: ("command" | "shift" | "option" | "control")[] }) => void;
  /** Only these keys go to `onKeyPress`; others pass on (e.g. to text fields). */
  keys?: string[];
  /**
   * Inside a sheet: while true, the sheet can't be swiped away (unsaved
   * changes, a game board's own swipes). Set it from the content itself.
   */
  interactiveDismissDisabled?: boolean;
  /** Inside an `<AbsoluteStack>`: where this view goes (its top-leading corner, or `anchor`), and its size. */
  position?: {
    x?: number | `${number}%`;
    y?: number | `${number}%`;
    width?: number | `${number}%`;
    height?: number | `${number}%`;
    anchor?: "topLeading" | "top" | "topTrailing" | "leading" | "center" | "trailing" | "bottomLeading" | "bottom" | "bottomTrailing";
  };
  /** Long-press and drag this view (to another view's `onDrop`, or another app) carrying this string. */
  draggable?: string;
  /** A drop target: the dropped strings, and where they landed in this view. */
  onDrop?: (drop: { items: string[]; location: { x: number; y: number } }) => void;
  /** Something is dragged over this target (true) or left (false). */
  onDropTargetChange?: (over: boolean) => void;
  /** Marks this view as where a `<Screen zoomFrom="…">` zooms from (and back into). iOS. */
  transitionSource?: string;
  /** The size of controls inside (buttons, pickers, steppers, toggles). */
  controlSize?: "mini" | "small" | "regular" | "large" | "extraLarge";
  /** How Labels inside show: icon only (toolbars), title only, or both. */
  labelStyle?: "iconOnly" | "titleOnly" | "titleAndIcon";
  /** Hide the status bar while this screen is up (full-screen media). */
  statusBarHidden?: boolean;
  /** "hidden": the home indicator fades (video, games). */
  persistentSystemOverlays?: "automatic" | "hidden" | "visible";
  /** VoiceOver actions (the actions rotor), reported to onAccessibilityAction. */
  accessibilityActions?: string[];
  onAccessibilityAction?: (name: string) => void;
  /** Make it adjustable for VoiceOver (swipe up / down): sliders, steppers, chart scrubbers. */
  onAccessibilityIncrement?: () => void;
  onAccessibilityDecrement?: () => void;
  /** Extend into the safe area (under the status bar and home indicator): true, or some edges. */
  ignoresSafeArea?: boolean | SafeAreaEdge | SafeAreaEdge[];
  /**
   * How this view's gestures combine with others: "simultaneous" (e.g. a drag
   * inside a ScrollView that still lets it scroll), "high" (wins over
   * children's gestures), or "normal" (default).
   */
  gesturePriority?: "normal" | "simultaneous" | "high";
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
  /**
   * Any element can hold attachments: `<Overlay>`, `<Background>`,
   * `<ContextMenu>`, `<SwipeActions>`, `<Sheet>`, `<Alert>`… (containers
   * also hold their content).
   */
  children?: ReactNode;
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
/**
 * `location` / `startLocation` are in window coordinates; `localLocation` /
 * `localStartLocation` are relative to the view's top-leading corner, and
 * `size` is the view's size. `translation` is from where the drag started.
 */
export type DragEvent = {
  translation: Point;
  location: Point;
  startLocation: Point;
  localLocation: Point;
  localStartLocation: Point;
  size: { width: number; height: number };
  velocity: Point;
  predictedEndTranslation: Point;
};

export type AccessibilityTrait =
  | "button" | "header" | "link" | "image" | "selected" | "staticText" | "searchField" | "summaryElement"
  | "updatesFrequently" | "toggle" | "modal" | "playsSound" | "startsMediaSession" | "allowsDirectInteraction";

type Alignment = "leading" | "center" | "trailing" | "top" | "bottom" | "topLeading" | "topTrailing" | "bottomLeading" | "bottomTrailing";

type WithChildren = { children?: ReactNode };
const host = <P,>(tag: string) => tag as unknown as FC<P>;

export const VStack = host<Modifiers & WithChildren & { spacing?: number; alignment?: "leading" | "center" | "trailing" }>("VStack");
export const HStack = host<Modifiers & WithChildren & { spacing?: number; alignment?: "top" | "center" | "bottom" | "firstTextBaseline" }>("HStack");
export const ZStack = host<Modifiers & WithChildren & { alignment?: Alignment }>("ZStack");
/**
 * Draws its children in a window above everything (presented sheets, the
 * navigation and tab bars): toasts, a thumbnail flying to the cart. They're
 * placed in the screen by `alignment`. Touches pass through to the app unless
 * `interactive`, in which case the children themselves take them.
 */
export const Portal = host<WithChildren & { alignment?: Alignment; interactive?: boolean }>("Portal");
/**
 * Children placed by their `position` prop (`{ x, y, width, height }` in
 * points or "25%" of the stack), as layout rather than an offset: a
 * `transition` scales a child around its own frame, and a changed position
 * animates. It fills the space it's offered (boards, canvases, overlays).
 */
export const AbsoluteStack = host<Modifiers & WithChildren>("AbsoluteStack");
/** Children are stacked in a VStack (HStack when horizontal) with `spacing` between them (SwiftUI's default if unset). */
/** Options shared by ScrollView and VirtualList. */
export type ScrollProps = {
  showsIndicators?: boolean;
  /**
   * true: snap to pages the size of the scroll view (carousels). "view"
   * (ScrollView): snap to children, for cards that peek at the edges.
   */
  paging?: boolean | "view";
  /**
   * Where content starts (and stays as it grows): "bottom" for chats,
   * "trailing" for a horizontal pager that opens on its last page.
   */
  defaultScrollAnchor?: "top" | "center" | "bottom" | "leading" | "trailing";
  /** Space around the scrollable content, inside the scroll view. */
  contentMargins?: number | { top?: number; leading?: number; bottom?: number; trailing?: number; horizontal?: number; vertical?: number };
  /** While scrolling: offset from the top/leading edge, and sizes. */
  onScroll?: (event: { x: number; y: number; contentWidth: number; contentHeight: number; width: number; height: number }) => void;
  /** The user started or stopped dragging, a fling is decelerating, or a `scrollTo` is animating. */
  onScrollPhaseChange?: (phase: "idle" | "tracking" | "interacting" | "decelerating" | "animating") => void;
};

/** Children are stacked in a VStack (HStack when horizontal) with `spacing` between them (SwiftUI's default if unset). */
export const ScrollView = host<
  Modifiers & WithChildren & ScrollProps & {
    axis?: "vertical" | "horizontal";
    spacing?: number;
    /** The index of the child at the leading (top) edge, when it changes: a carousel's current page (children of equal size). */
    onScrollIndexChange?: (index: number) => void;
  }
>("ScrollView");

type Editable = {
  /** Swipe-to-delete on the rows: called with the deleted children's indices. */
  onDelete?: (indices: number[]) => void;
  /** Reordering in edit mode (see `<EditButton>`): move children at `from` to before index `to`. */
  onMove?: (move: { from: number[]; to: number }) => void;
};

export const List = host<
  Modifiers & WithChildren & Editable & {
    listStyle?: "automatic" | "plain" | "grouped" | "insetGrouped" | "inset" | "sidebar";
    /** "hidden": no list background, so the List's own `background` (or what's behind) shows. */
    scrollContentBackground?: "visible" | "hidden";
    /** The selected row's `tag` (iPad sidebars highlight it); rows need a `tag`. */
    selection?: string | null;
    onSelectionChange?: (tag: string | null) => void;
  }
>("List");
export const Form = host<Modifiers & WithChildren & { scrollContentBackground?: "visible" | "hidden" }>("Form");
/** `header` / `footer` as text, or `<SectionHeader>` / `<SectionFooter>` children for anything else. */
export const Section = host<Modifiers & WithChildren & Editable & { header?: string; footer?: string }>("Section");
export const SectionHeader = host<Modifiers & WithChildren>("SectionHeader");
export const SectionFooter = host<Modifiers & WithChildren>("SectionFooter");
/** Toggles edit mode for the List on this screen (reordering with `onMove`). */
export const EditButton = host<Modifiers>("EditButton");

/** Rows (`<GridRow>`) of cells aligned in columns, sized to fit (not lazy, not scrolling). */
export const Grid = host<Modifiers & WithChildren & { alignment?: Alignment; horizontalSpacing?: number; verticalSpacing?: number }>("Grid");
export const GridRow = host<Modifiers & WithChildren & { alignment?: "top" | "center" | "bottom" | "firstTextBaseline" }>("GridRow");
/** Lays children out in rows, wrapping to the next line when full (tags, chips). */
export const Flow = host<Modifiers & WithChildren & { spacing?: number; lineSpacing?: number; alignment?: "leading" | "center" | "trailing" }>("Flow");

/** Drawn over the parent element, sized to it (`alignment` places it: badges in a corner). */
export const Overlay = host<Modifiers & WithChildren & { alignment?: Alignment }>("Overlay");
/** Drawn behind the parent element, sized to it. */
export const Background = host<Modifiers & WithChildren & { alignment?: Alignment }>("Background");
/**
 * Docked to an edge of the parent element, which insets its content (scroll
 * views scroll above it): mini players, input bars.
 */
export const SafeAreaInset = host<Modifiers & WithChildren & { edge?: "top" | "bottom" | "leading" | "trailing"; spacing?: number }>("SafeAreaInset");

/**
 * Text. Nest `<Text>` for styled runs (`<Text>Hello <Text fontWeight="bold"
 * foregroundStyle="blue">world</Text></Text>`), and `<Image systemName>` for
 * inline symbols. Runs take the text props below plus font, fontWeight,
 * fontDesign and foregroundStyle.
 */
export const Text = host<
  Modifiers & WithChildren & {
    bold?: boolean;
    /** `true`, or the line's color. */
    strikethrough?: boolean | ColorValue;
    italic?: boolean;
    /** `true`, or the underline's color. */
    underline?: boolean | ColorValue;
    /** On a nested run (`<Text>` inside `<Text>`): tapping it (an @mention, a hashtag). */
    onPress?: () => void;
    /** Links in `markdown` (and tapped runs without onPress) come here instead of the system: in-app links. */
    onOpenURL?: (url: string) => void;
    /** With `lineLimit`: whether the text is cut off (show "more"). */
    onTruncationChange?: (truncated: boolean) => void;
    /** Extra space between characters, in points. */
    kerning?: number;
    tracking?: number;
    /** Extra space between lines, in points. */
    lineSpacing?: number;
    /** Shrinks the font down to this fraction (e.g. 0.5) before truncating. */
    minimumScaleFactor?: number;
    textCase?: "uppercase" | "lowercase";
    /** Runs only: raise (or lower, negative) from the baseline, in points. */
    baselineOffset?: number;
    /** Inline Markdown instead of children: **bold**, *italic*, `code`, [links](https://…) that open. */
    markdown?: string;
    /** Long-press to select and copy. */
    selectable?: boolean;
    /** How changes animate: rolling digits ("numericText", the default with `animation`), "opacity", "interpolate" or none. */
    contentTransition?: "numericText" | "opacity" | "interpolate" | "identity";
    monospacedDigit?: boolean;
    // With an `animation` prop, changing digits roll (numeric content transition).
    /** Maximum lines; the rest is truncated with "…". */
    lineLimit?: number;
    /** Alignment of wrapped lines. */
    textAlignment?: "leading" | "center" | "trailing";
  }
>("Text");
type ImageSource =
  /** An SF Symbol. Sized like text unless `resizable`. */
  | {
      systemName: string;
      resizable?: boolean;
      imageScale?: "small" | "medium" | "large";
      contentMode?: "fit" | "fill";
      /** "multicolor" (the symbol's own colors), "hierarchical" (one color in layers), "palette" (`paletteColors`). */
      symbolRenderingMode?: "monochrome" | "hierarchical" | "palette" | "multicolor";
      /** Up to three colors for the "palette" rendering mode. */
      paletteColors?: ColorValue[];
      symbolVariant?: "fill" | "circle" | "square" | "rectangle" | "slash" | "circleFill";
      /** 0–1 for symbols with variable parts (wifi, speaker.wave.3). */
      variableValue?: number;
      /**
       * `{ type: "bounce", value }` plays once each time `value` changes;
       * `{ type: "pulse", active }` runs while active.
       */
      symbolEffect?:
        | { type: "bounce" | "wiggle" | "rotate"; value?: unknown; /** Also play when the symbol appears. */ onAppear?: boolean }
        | { type: "pulse" | "variableColor" | "breathe" | "wiggle" | "rotate"; active?: boolean };
    }
  /** An image from the app's asset catalog; resizable. */
  | { name: string; contentMode?: "fit" | "fill" }
  /**
   * A URL (https:, file:, data:), loaded with a memory cache and decoded off
   * the main thread; resizable. Give it a `frame`. Shows a placeholder while loading.
   */
  | {
      src: string;
      contentMode?: "fit" | "fill";
      /** "none": show nothing while loading. Or give the Image children: they show while loading and after an error. */
      placeholder?: "gray" | "none";
      onLoad?: (size: { width: number; height: number }) => void;
      onError?: (error: { message: string }) => void;
    };
export const Image = host<Modifiers & ImageSource>("Image");
export const Label = host<Modifiers & { title: string; systemImage: string }>("Label");
type ShapeProps = Modifiers & {
  /** Default: the foreground style. */
  fill?: Fill;
  /** Outline, drawn inside the frame. */
  stroke?: Fill;
  lineWidth?: number;
  /** Dash and gap lengths, e.g. [6, 4]. */
  dash?: number[];
  /** Draw only part of the stroke, from 0 to 1 (progress rings). */
  trim?: [number, number];
  lineCap?: "butt" | "round" | "square";
  lineJoin?: "miter" | "round" | "bevel";
};

type PathBox = {
  /** The coordinate box the path is drawn in: [x, y, width, height] (default [0, 0, 100, 100]). */
  viewBox?: [number, number, number, number];
  /** "stretch" (default) fills the frame; "fit" keeps the box's proportions. */
  preserveAspectRatio?: "stretch" | "fit";
};

/** An SVG path (`d="M0 50 L50 0 …"`: M L H V C S Q T A Z, absolute and relative). Strokes with the foreground by default. */
export const Path = host<ShapeProps & PathBox & { d: string }>("Path");

/** A fill or stroke for `<Canvas>` drawing: a color, or a gradient from `ctx.create…Gradient`. */
export type CanvasStyle = ColorValue | CanvasGradient;
export type CanvasGradient = { addColorStop(offset: number, color: ColorValue): void };

/**
 * The drawing context a `<Canvas draw>` worklet gets: a subset of the web's
 * CanvasRenderingContext2D (paths, fills and strokes, text, transforms,
 * gradients), plus `circle()` and `drawImage(systemName, …)` for SF Symbols.
 */
export type CanvasContext = {
  fillStyle: CanvasStyle;
  strokeStyle: CanvasStyle;
  lineWidth: number;
  lineCap: "butt" | "round" | "square";
  lineJoin: "miter" | "round" | "bevel";
  globalAlpha: number;
  /** "bold 16px", a size, or `{ size, weight }`. */
  font: string | number | { size?: number; weight?: FontWeight };
  textAlign: "start" | "left" | "center" | "end" | "right";
  textBaseline: "top" | "middle" | "alphabetic" | "bottom";
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  quadraticCurveTo(cx: number, cy: number, x: number, y: number): void;
  bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void;
  /** Angles in radians, clockwise from the positive x axis (as on the web). */
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void;
  ellipse(x: number, y: number, radiusX: number, radiusY: number): void;
  circle(x: number, y: number, radius: number): void;
  rect(x: number, y: number, width: number, height: number): void;
  roundRect(x: number, y: number, width: number, height: number, radius?: number): void;
  closePath(): void;
  fill(style?: CanvasStyle): void;
  stroke(style?: CanvasStyle): void;
  clip(): void;
  fillRect(x: number, y: number, width: number, height: number): void;
  strokeRect(x: number, y: number, width: number, height: number): void;
  clearRect(x: number, y: number, width: number, height: number): void;
  fillText(text: string, x: number, y: number): void;
  /** An SF Symbol in a rect, tinted with `fillStyle`. */
  drawImage(systemName: string, x: number, y: number, width: number, height: number): void;
  setLineDash(segments: number[]): void;
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  rotate(radians: number): void;
  scale(x: number, y?: number): void;
  transform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient;
  createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasGradient;
};

/**
 * Immediate-mode drawing. `draw` is a worklet (automatically, when written
 * inline): it runs on the main thread when the canvas draws, and draws again
 * when its size changes, when shared values it reads change (animate them
 * and the drawing follows, frame by frame), or every frame with
 * `continuous` (`time` is seconds since the canvas appeared).
 *
 *   <Canvas frame={{ height: 120 }} draw={(ctx, { width, height }) => {
 *     ctx.fillStyle = "orange";
 *     ctx.circle(width / 2, height / 2, radius.get());
 *     ctx.fill();
 *   }} />
 */
export const Canvas = host<
  Modifiers & {
    draw: (ctx: CanvasContext, size: { width: number; height: number }, time: number) => void;
    continuous?: boolean;
  }
>("Canvas");
/** Straight lines through `points` ([x, y] in the view box): sparklines; `closed` + `fill` for areas. */
export const Polyline = host<ShapeProps & PathBox & { points: [number, number][]; closed?: boolean }>("Polyline");

// Shapes fill the space they're offered: give them a `frame`.
export const Rectangle = host<ShapeProps>("Rectangle");
export const RoundedRectangle = host<ShapeProps & { cornerRadius?: CornerRadius }>("RoundedRectangle");
export const Circle = host<ShapeProps>("Circle");
export const Ellipse = host<ShapeProps>("Ellipse");
export const Capsule = host<ShapeProps>("Capsule");

/** A label and a value on one row ("Version … 1.0"), aligned the way Forms and Lists do it. */
/** `label` as text, or a `<LabeledContentLabel>` child for any view (an icon, a font). */
export const LabeledContent = host<Modifiers & WithChildren & { label?: string }>("LabeledContent");
export const LabeledContentLabel = host<Modifiers & WithChildren>("LabeledContentLabel");

export const Spacer = host<Modifiers & { minLength?: number }>("Spacer");
export const Divider = host<Modifiers>("Divider");
/** A spinner, or a bar when `value` is set. */
export const ProgressView = host<Modifiers & { value?: number; total?: number; label?: string; tint?: ColorValue }>("ProgressView");

export const Button = host<
  Modifiers & WithChildren & {
    onPress: () => void;
    title?: string;
    /** An SF Symbol next to `title` (menus, swipe actions, toolbars). */
    systemImage?: string;
    role?: "destructive" | "cancel";
    buttonStyle?: "automatic" | "bordered" | "borderedProminent" | "borderless" | "plain";
    /** Accent color of the button (and its background in `<SwipeActions>`). */
    tint?: ColorValue;
    /**
     * A hardware keyboard shortcut: "k" (⌘K), `{ key, modifiers }`, or
     * "default" / "cancel" (Return / Escape in dialogs).
     */
    keyboardShortcut?: string | { key: string; modifiers?: ("command" | "shift" | "option" | "control")[] };
    /**
     * While pressed: scale (e.g. 0.95), opacity, or a background behind the
     * content. Any of these (or onPressIn / onPressOut) replaces `buttonStyle`
     * with a plain style that shows your content as is.
     */
    pressedBackground?: Fill;
    /** Fires after holding (`longPressDuration`, default 0.5 s); the release then doesn't fire `onPress`. */
    onLongPress?: () => void;
    longPressDuration?: number;
  }
>("Button");

type TextInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  /** Focus when it appears. */
  autoFocus?: boolean;
  keyboardType?: "default" | "email" | "number" | "decimal" | "phone" | "url" | "numbersAndPunctuation" | "webSearch" | "asciiCapable";
  /** What the field holds, for AutoFill and the keyboard's suggestions. */
  textContentType?:
    | "name" | "givenName" | "familyName" | "nickname" | "email" | "phone" | "username" | "password" | "newPassword"
    | "oneTimeCode" | "url" | "streetAddress" | "streetAddressLine1" | "streetAddressLine2" | "postalCode" | "city" | "state"
    | "cityAndState" | "country" | "organization" | "jobTitle" | "birthdate"
    | "creditCardNumber" | "creditCardExpiration" | "creditCardSecurityCode" | "creditCardName";
  autocapitalize?: "none" | "sentences" | "words" | "characters";
  autocorrect?: boolean;
  tint?: ColorValue;
  /**
   * Controlled focus: true focuses the field, false blurs it. Move focus
   * between fields with state (`focused={field === "email"}`); onFocus /
   * onBlur report what the user did.
   */
  focused?: boolean;
  /** Set the cursor or selection (UTF-16 offsets, like JS string indices); applied when it changes. */
  selection?: { start: number; end?: number };
  /** The delete key (software keyboard too); `empty` when the field was already empty (OTP boxes step back). */
  onDeleteBackward?: (event: { empty: boolean }) => void;
  /** The cursor or selection as the user moves it (insert at the cursor: `text.slice(0, start) + x + text.slice(end)`). */
  onSelectionChange?: (selection: { start: number; end: number }) => void;
};

export const TextField = host<
  Modifiers & TextInputProps & {
    onSubmit?: () => void;
    secure?: boolean;
    /** "roundedBorder" (default), "plain" (e.g. in a Form), or "automatic". */
    textFieldStyle?: "roundedBorder" | "plain" | "automatic";
    /** "vertical": grows to more lines as you type (between minLines and maxLines). */
    axis?: "horizontal" | "vertical";
    minLines?: number;
    maxLines?: number;
    /** The return key's label. */
    submitLabel?: "return" | "done" | "go" | "send" | "join" | "route" | "search" | "next" | "continue";
    /** false: keep the keyboard up after submitting (rapid entry). */
    blurOnSubmit?: boolean;
    textAlignment?: "leading" | "center" | "trailing";
  }
>("TextField");
/** A multi-line, scrolling text editor (notes, descriptions). Give it a frame. */
export const TextEditor = host<Modifiers & TextInputProps & { scrollContentBackground?: "visible" | "hidden" }>("TextEditor");

/** Hex colors in and out: "#rrggbb" (or "#rrggbbaa" with `supportsOpacity`). */
export const ColorPicker = host<Modifiers & { value: string; onChange: (hex: string) => void; label?: string; supportsOpacity?: boolean }>("ColorPicker");

/**
 * A button that opens a menu of its children: Buttons, Dividers, Sections,
 * Pickers, and nested Menus (submenus). Works in toolbars and context menus.
 * With `onPress`, a tap runs it and a long press opens the menu.
 */
export const Menu = host<Modifiers & WithChildren & { title?: string; systemImage?: string; onPress?: () => void; tint?: ColorValue }>("Menu");
/** A `<Menu>`'s label as any view (instead of `title` / `systemImage`). */
export const MenuLabel = host<Modifiers & WithChildren>("MenuLabel");
export const Toggle = host<Modifiers & WithChildren & { value: boolean; onChange: (value: boolean) => void; label?: string; tint?: ColorValue }>("Toggle");
export const Slider = host<
  Modifiers & {
    value: number;
    onChange: (value: number) => void;
    /** true when the finger goes down, false when it lifts (seek on release while scrubbing). */
    onEditingChange?: (editing: boolean) => void;
    min?: number;
    max?: number;
    step?: number;
    tint?: ColorValue;
  }
>("Slider");
/** The label is `label`, or the children; with neither, just the −/+ control. */
export const Stepper = host<Modifiers & WithChildren & { value: number; onChange: (value: number) => void; min?: number; max?: number; step?: number; label?: string; tint?: ColorValue }>("Stepper");
/** The native Picker (string values). Use `Picker` (controls.tsx), which also takes numbers. */
export const PickerHost = host<Modifiers & { value: string; onChange: (value: string) => void; options: { value: string; label: string; systemImage?: string }[]; label?: string; pickerStyle?: PickerStyle; tint?: ColorValue }>("Picker");
export type PickerStyle = "menu" | "segmented" | "inline" | "palette" | "wheel" | "navigationLink";

// MARK: Media

/** A video (AVKit). `controls={false}` shows just the picture (a looping background). */
export const Video = host<
  Modifiers & {
    src: string;
    autoPlay?: boolean;
    /** Controlled: true pauses, false plays. */
    paused?: boolean;
    muted?: boolean;
    loop?: boolean;
    controls?: boolean;
    contentMode?: "fit" | "fill";
    onReady?: (info: { duration: number }) => void;
    /** About twice a second while playing. */
    onTimeUpdate?: (time: { currentTime: number; duration: number }) => void;
    onEnd?: () => void;
  }
>("Video");

/** A web page (WKWebView): a URL, or HTML. Give it a frame. */
export const WebView = host<
  Modifiers & {
    url?: string;
    html?: string;
    /** Resolves relative links in `html`. */
    baseURL?: string;
    /** Run in each page when it finishes loading. */
    injectedJavaScript?: string;
    scrollEnabled?: boolean;
    onLoad?: (page: { url: string; title: string }) => void;
    onError?: (message: string) => void;
    /** From the page: `window.webkit.messageHandlers.swiftjsx.postMessage(data)`. */
    onMessage?: (data: unknown) => void;
  }
>("WebView");

export type MapRegion = { latitude: number; longitude: number; latitudeDelta?: number; longitudeDelta?: number };

/**
 * A map (MapKit) with `<Marker>`, `<MapAnnotation>` and overlay
 * (`<MapPolyline>`, `<MapPolygon>`, `<MapCircle>`) children. (Not `Map`: that
 * would shadow JS's Map.)
 */
export const MapView = host<
  Modifiers & WithChildren & {
    /** Where the camera is; changing it moves the map. */
    region?: MapRegion;
    /** When the user stops panning or zooming. */
    onRegionChange?: (region: Required<MapRegion>) => void;
    /** A tap on the map, at this coordinate. */
    onPress?: (coordinate: { latitude: number; longitude: number }) => void;
    mapStyle?: "standard" | "imagery" | "hybrid";
    /**
     * The blue dot. Asks for when-in-use permission the first time (the app
     * needs `NSLocationWhenInUseUsageDescription` in its Info.plist).
     */
    showsUserLocation?: boolean;
    /** Keep the camera on the user (until they pan; `region` takes over when it changes). */
    followsUserLocation?: boolean;
    controls?: ("userLocation" | "compass" | "scale" | "pitchToggle")[];
  }
>("Map");
/** `{ latitude, longitude }` objects or `[latitude, longitude]` pairs (GeoJSON's are `[longitude, latitude]`). */
export type MapCoordinates = ({ latitude: number; longitude: number } | [number, number])[];
type MapStroke = { stroke?: ColorValue; lineWidth?: number };
/** A route or track on a `<MapView>`. */
export const MapPolyline = host<MapStroke & { coordinates: MapCoordinates }>("MapPolyline");
/** An outlined area. */
export const MapPolygon = host<MapStroke & { coordinates: MapCoordinates; fill?: ColorValue }>("MapPolygon");
/** A circle `radius` meters around a coordinate. */
export const MapCircle = host<MapStroke & { latitude: number; longitude: number; radius: number; fill?: ColorValue }>("MapCircle");
/** A balloon marker on a `<MapView>`. */
export const Marker = host<{ latitude: number; longitude: number; title?: string; systemImage?: string; tint?: ColorValue }>("Marker");
/** Any views on a `<MapView>`, centered on the coordinate. */
export const MapAnnotation = host<WithChildren & { latitude: number; longitude: number; title?: string }>("MapAnnotation");

/** A button that opens the share sheet for `url` or `text`; children are its label (default: "Share"). */
export const ShareLink = host<Modifiers & WithChildren & { url?: string; text?: string; subject?: string; message?: string }>("ShareLink");

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
    /** Page dots (`tabViewStyle="page"`): "backed" puts them on a dimmed capsule, readable over light content. */
    pageIndicator?: "automatic" | "always" | "never" | "backed";
  }
>("TabView");

/** In a `<TabView>`: a bar above the tab bar, like a mini player (iOS 26). */
export const TabAccessory = host<WithChildren>("TabAccessory");
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
    /** Hides the tab (its content stays mounted). */
    hidden?: boolean;
    /** On the tab bar item (UI tests find it by this). */
    accessibilityIdentifier?: string;
    accessibilityLabel?: string;
    accessibilityHint?: string;
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
    /** Which columns show (iPad, Mac); the user changing it reports onColumnVisibilityChange. */
    columnVisibility?: "automatic" | "all" | "doubleColumn" | "detailOnly";
    onColumnVisibilityChange?: (visibility: "automatic" | "all" | "doubleColumn" | "detailOnly") => void;
  }
>("NavigationSplitView");

/** Sets the navigation title and toolbar for whatever screen it's rendered in. */
export const Screen = host<
  Modifiers & WithChildren & {
    title?: string;
    /** Under the title (iOS 26 and later). */
    subtitle?: string;
    /** Pushed: zoom out of the view with this `transitionSource` (iOS). */
    zoomFrom?: string;
    titleDisplayMode?: "automatic" | "inline" | "large";
    /** A search field in the navigation bar (controlled with `onSearchTextChange`). */
    searchText?: string;
    onSearchTextChange?: (text: string) => void;
    searchPrompt?: string;
    /**
     * Where the search field goes: "automatic" (iOS 26: the bottom toolbar, or the tab
     * bar's search tab when the screen is in a `<Tab role="search">`), "navigationBar"
     * (always under the title), or "toolbar".
     */
    searchPlacement?: "automatic" | "navigationBar" | "toolbar";
    /** Whether the search field is active (false dismisses it from code); onSearchActiveChange reports the user's taps and Cancel. */
    searchActive?: boolean;
    onSearchActiveChange?: (active: boolean) => void;
    /** The keyboard's Search key. */
    onSearchSubmit?: (text: string) => void;
    /** Scopes under the search field while it's active (a segmented control). */
    searchScopes?: { value: string; label: string }[];
    searchScope?: string;
    onSearchScopeChange?: (scope: string) => void;
    /** Suggestions under the field; tapping one puts `completion` (or `title`) in the field. */
    searchSuggestions?: { title: string; completion?: string; systemImage?: string }[];
    /** The navigation bar's background (shown even before scrolling), or "hidden". */
    toolbarBackground?: Fill | "hidden";
    /** Light or dark navigation bar items (e.g. "dark" for white items on a dark screen). */
    toolbarColorScheme?: "light" | "dark";
  }
>("Screen");

/**
 * Buttons revealed by swiping a row of a `<List>` (put it inside the row).
 * Give buttons `tint` or `role="destructive"` for their color.
 */
export const SwipeActions = host<WithChildren & { edge?: "leading" | "trailing"; allowsFullSwipe?: boolean }>("SwipeActions");

/** Buttons shown when the parent element is long-pressed. */
export const ContextMenu = host<WithChildren>("ContextMenu");

export const ToolbarItem = host<
  WithChildren & {
    placement?:
      | "automatic" | "primaryAction" | "cancellationAction" | "confirmationAction" | "principal" | "navigation"
      | "topBarLeading" | "topBarTrailing" | "bottomBar" | "keyboard";
  }
>("ToolbarItem");

export const SheetHost = host<
  WithChildren & {
    isPresented: boolean;
    /** Called when the user dismisses it (swipe down, Esc…); set your state to false. */
    onDismiss: () => void;
    /** After it has gone (the dismiss animation finished), however it was dismissed. */
    onDismissed?: () => void;
    /** The user tried to swipe it away while interactiveDismissDisabled: ask "Discard changes?". */
    onDismissAttempt?: () => void;
    detents?: ("medium" | "large" | number)[];
    /** iOS: cover the whole screen instead of a card. */
    fullScreen?: boolean;
    interactiveDismissDisabled?: boolean;
    dragIndicator?: "automatic" | "visible" | "hidden";
    cornerRadius?: number;
    background?: Fill;
  }
>("Sheet");
export const AlertHost = host<WithChildren & { isPresented: boolean; onDismiss: () => void; title: string; message?: string }>("Alert");
export const ConfirmationDialogHost = host<WithChildren & { isPresented: boolean; onDismiss: () => void; title: string; message?: string }>("ConfirmationDialog");

// MARK: Charts (Swift Charts)

type ChartX = string | number | Date;

/**
 * An axis: where it sits, which values get marks, and how they read.
 * `format` for numbers: "integer", "decimal", "percent" (0.5 → 50%),
 * "compact" (1.2K), "currency:USD", a "+" prefix for signs ("+integer"), or a
 * template ("{} km"). For dates: "weekday", "weekdayNarrow", "day", "month",
 * "monthNarrow", "monthDay", "hour", "time", "year".
 */
export type ChartAxis = {
  position?: "leading" | "trailing" | "top" | "bottom";
  /** Marks at exactly these values (numbers, Dates or categories), or `{ value, label }` for text of your own. */
  values?: (number | Date | string | { value: number | Date | string; label: string })[];
  /** A mark every `stride` (numbers), or every `count` `unit`s (dates). */
  stride?: number | { unit: CalendarUnit; count?: number };
  /** About how many marks (automatic placement). */
  count?: number;
  format?: string;
  /** Default true. */
  gridlines?: boolean;
  ticks?: boolean;
  labels?: boolean;
};
export type CalendarUnit = "minute" | "hour" | "day" | "week" | "weekOfYear" | "month" | "quarter" | "year";

/**
 * A chart. Children are marks: `<BarMark>`, `<LineMark>`, `<AreaMark>`,
 * `<PointMark>`, `<RuleMark>`, `<RectangleMark>`. Give it a `frame` height.
 */
export const Chart = host<
  Modifiers & WithChildren & {
    /** `[min, max]` for the axes (numbers, or Dates for x). */
    xDomain?: [number, number] | [Date, Date];
    yDomain?: [number, number];
    xAxis?: "automatic" | "hidden" | ChartAxis;
    yAxis?: "automatic" | "hidden" | ChartAxis;
    legend?: "automatic" | "hidden";
    /** Colors for marks with a `series`: `{ Deep: "indigo", REM: "cyan" }`. */
    seriesColors?: Record<string, ColorValue>;
    /**
     * Scrubbing: the x value under the finger (null when released). Dates
     * come as ms since 1970; with marks' `xUnit`, the start of the day / week
     * / month under the finger (the bar's own date).
     */
    onXSelectionChange?: (x: string | number | null) => void;
    /** The y value under the finger (null when released). */
    onYSelectionChange?: (y: number | null) => void;
    /** A span of x: two fingers on iOS (numbers, or dates as ms). Null when released. */
    onXRangeSelectionChange?: (range: [number, number] | null) => void;
    /**
     * Scrolls horizontally, showing this much x at a time: a number, for
     * dates seconds or `{ unit: "day", count: 7 }`, for categories how many.
     */
    xVisibleDomain?: number | { unit: CalendarUnit; count?: number };
    /** Where a scrolling chart starts: the x at its leading edge (default: the start). */
    xScrollPosition?: ChartX;
    /** While scrolling: the x at the leading edge (dates as ms). */
    onXScrollPositionChange?: (x: string | number) => void;
    /** Snap to multiples of a number, or to calendar units ("day", "week", "month"), when the finger lifts. */
    xScrollAlignment?: number | "hour" | "day" | "week" | "month" | "year";
  }
>("Chart");

type MarkProps = {
  /** A category, a number, or a Date. */
  x?: ChartX;
  /** Date `x`: the whole day / week / month it stands for (bars span it, axes align to it). */
  xUnit?: CalendarUnit;
  y?: number;
  /** Names the axes' values for accessibility (VoiceOver audio graphs). */
  xLabel?: string;
  yLabel?: string;
  /** Groups marks: stacked bars per category, one line per series, colored by `seriesColors`. */
  series?: string;
  foregroundStyle?: Fill;
  opacity?: number;
  /** Text above (or `annotationPosition`) the mark: goal lines, highlights. */
  annotation?: string;
  annotationPosition?: "top" | "bottom" | "leading" | "trailing" | "overlay";
  /** Where the annotation sits along that side (default "center"). */
  annotationAlignment?: Alignment;
};

type Interpolated = { interpolation?: "linear" | "catmullRom" | "monotone" | "stepStart" | "stepCenter" | "stepEnd" | "cardinal" };
type Stroked = { lineWidth?: number; dash?: number[] };

export const BarMark = host<
  MarkProps & {
    /** A floating bar from yStart to yEnd (ranges) instead of from zero to y. */
    yStart?: number;
    yEnd?: number;
    stacking?: "standard" | "normalized" | "center" | "unstacked";
    cornerRadius?: number;
    barWidth?: number;
    /** Fraction of the available width (0–1). */
    barWidthRatio?: number;
  }
>("BarMark");
export const LineMark = host<MarkProps & Interpolated & Stroked>("LineMark");
/** Filled from zero to y, or between yStart and yEnd (a band). */
export const AreaMark = host<MarkProps & Interpolated & { yStart?: number; yEnd?: number; stacking?: "standard" | "normalized" | "center" | "unstacked" }>("AreaMark");
export const PointMark = host<
  MarkProps & {
    symbolSize?: number;
    symbol?: "circle" | "square" | "triangle" | "diamond" | "pentagon" | "plus" | "cross" | "asterisk";
    /** An outline this wide instead of a filled symbol (a ring around a selected point). */
    symbolStroke?: number;
  }
>("PointMark");
/** A horizontal line at `y` (goals, averages) or a vertical one at `x`. */
export const RuleMark = host<MarkProps & Stroked>("RuleMark");
/** A rectangle from xStart to xEnd and yStart to yEnd (timelines, hypnograms). */
export const RectangleMark = host<MarkProps & { xStart?: ChartX; xEnd?: ChartX; yStart?: number; yEnd?: number; cornerRadius?: number }>("RectangleMark");
