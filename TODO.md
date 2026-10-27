# TODO

Known gaps and ideas, roughly by area. Nothing here is scheduled. Many items come from
building the toy apps in `examples/apps/` (Hacker News, Todos, Weather, Pokédex, Chat,
Flashcards): what each one wanted and couldn't do.

## Layout and drawing

- [ ] Shapes: `Circle`, `Capsule`, `RoundedRectangle` with fill and stroke, per-corner
      radii (chat bubble tails), `cornerRadius="capsule"`. Today it's stacks with
      `cornerRadius = size / 2`.
- [ ] Proportional layout: `GeometryReader` / `containerRelativeFrame`, `layoutPriority`,
      a non-lazy `Grid`, and a wrapping (flow) layout for chips. Bars and gauges are
      fixed-width with point math.
- [ ] `overlay` prop (badges), `zIndex`, `contentShape` (full-row taps on plain buttons).
- [ ] Gradients beyond linear top-to-bottom: stops/locations, radial and angular.

## Text, color, symbols

- [ ] Fonts: numeric size and weight (`font={{ size: 96, weight: "thin" }}`),
      `minimumScaleFactor`, `textCase`, kerning, custom fonts.
- [ ] Styled runs and inline images: nested `<Text>` only concatenates strings.
- [ ] Colors: opacity on named colors, semantic system colors (systemBackground,
      secondarySystemGroupedBackground, separator…), light/dark pairs for custom colors.
      `foregroundStyle="secondary"` is a fixed gray, not the hierarchical secondary of the
      current style; no tertiary/quaternary.
- [ ] Color scheme: `preferredColorScheme`, toolbar background and color scheme (white
      toolbar items on a dark gradient screen).
- [ ] SF Symbols: rendering modes (multicolor, hierarchical, palette), `symbolEffect`,
      symbol content transitions.

## Components

- [ ] `Menu` (toolbar menus, submenus in context menus), `DatePicker`, `ColorPicker`.
- [ ] `TextField`: styles (plain vs rounded border), multi-line growth / `TextEditor`,
      autofocus, `submitLabel`, keyboard type, autocapitalization, keep focus on submit,
      clear button.
- [ ] `Picker`: infer the value type from `options`; options with images or colors.
- [ ] `<Image src>`: placeholder and error content (today a gray box / "photo" symbol).
- [ ] `Section` headers and footers as views, not just strings.
- [ ] `Button`: `controlSize`; `Label`: `labelStyle`, separate icon color.
- [ ] `redacted(.placeholder)` for skeleton loading.
- [ ] Platform APIs: clipboard (`navigator.clipboard`), haptics (`sensoryFeedback`),
      accessibility actions (custom VoiceOver actions).
- [ ] `Canvas`, maps (MapKit), video (AVKit), web views.
- [ ] Keyboard toolbar and keyboard events.

## Lists and scrolling

- [ ] `List` styling: `listStyle` (plain…), row background / insets / separators, row
      `badge`, NavigationLink-style rows (chevron, full-width tap), `onDelete` / `onMove`
      / edit mode.
- [ ] Swipe actions on the UIKit-backed `VirtualList listStyle="list"`.
- [ ] `VirtualList` grid mode: React still renders every child of a `LazyVGrid`, so big
      grids need a virtualized grid (the Pokédex enables per-card queries on `onAppear`).
- [ ] ScrollView: `showsIndicators`, paging / scroll target behavior, content margins,
      `defaultScrollAnchor="bottom"` (chat), `onScroll` (is the user at the bottom?).
- [ ] Over the UIKit list, a large navigation title doesn't collapse into the inline
      title (SwiftUI only tracks its own scroll views); use `titleDisplayMode="inline"`.
      Off iOS, `listStyle="list"` is still SwiftUI's `List`.
- [ ] Without `itemHeight`, `VirtualList.scrollTo(index)` lands on an estimate
      (`estimatedItemHeight`) when rows vary in height.

## Navigation and presentation

- [ ] Item-based presentations (`sheet(item:)`, `alert(item:)`): today you keep the item
      and the flag in separate state so content doesn't change while dismissing.
- [ ] Sheet content that resets between openings (today: bump a `key`).
- [ ] `Navigator.replace`, a `Screen` subtitle, toolbar `bottomBar` placement.
- [ ] Search: `isSearching`, dismiss from code, submit / cancel events, scopes,
      suggestions, placement.
- [ ] Zoom navigation transitions / matched geometry (grid → detail).

## Gestures and animation

- [x] Worklets: gesture handlers and animated styles on the main thread
      (`useSharedValue`, `useAnimatedStyle`, `withSpring`, `withTiming`, `runOnJS`).
- [x] `withAnimation` from JS, and SwiftUI animation specs for the `animation` prop.
- [ ] Worklet animations are SwiftUI animations: a worklet can't read a value
      mid-animation; styles map end states that SwiftUI interpolates (a non-linear
      mapping can look wrong mid-flight); no completion callbacks, `withDecay`,
      `withRepeat` or `withSequence`.
- [ ] No `useDerivedValue` / `useAnimatedReaction`; only gesture handlers can be
      worklets; no screen size inside worklets.
- [ ] Spring animations started from a gesture don't take the finger's velocity.
- [ ] Transforms: `rotation3DEffect` (card flips), x/y scale, rotation/scale anchors.
- [ ] Value-keyed animations (animate one property when one value changes) and an
      "animate on appear" option.

## Rendering

- [ ] `foregroundStyle`, gestures, transforms, accessibility props and refs are attached
      the first time a view uses them and then stay (always-on, idle gestures doubled
      scroll hitches in long lists). So the *first* time one of them appears on a view
      that's already mounted, that view's SwiftUI state resets once (a text field inside
      it loses focus). Props present from mount never reset it. `foregroundStyle` has no
      no-op form: `.foregroundStyle(.foreground)` and the three-level
      `.foregroundStyle(.primary, .secondary, .tertiary)` both turn a List's gray
      headers black.
- [ ] Modifier props on a `Section` silently stop it being a section (it gets wrapped).

## Web APIs

- [ ] Streams: no `ReadableStream`; `fetch` bodies are buffered (no streaming responses
      or upload progress). No `FormData` bodies, no `XMLHttpRequest`.
- [ ] `TextDecoder` is UTF-8 only and has no streaming mode.
- [ ] WebSocket: no extensions or ping control.
- [ ] No `document`: libraries that need a DOM won't work (by design).

## Build and tooling

- [ ] Surface React Compiler bail-outs in development (console or red box), not just
      in the build log; they're easy to miss.
- [ ] The React Compiler runs on Babel 7: `babel-plugin-react-compiler` 1.0 is built
      against Babel 7's AST, and under Babel 8 it rejects some valid code (e.g.
      destructuring defaults). It also hit an internal error on one function in the
      Weather app (left unmemoized).
- [ ] React DevTools support.
- [ ] CI: `swift test` on macOS, plus the XCUITest suite in `Apps/iOS` on a simulator.
- [ ] `xcodebuild test` hangs after the UI tests finish (an Xcode quirk while writing
      the results); it has to be stopped by hand once it prints "Executed N tests".
- [ ] Hot reload only works in the simulator (it reads `build/app.js` from the host).
      Serve the bundle over the network for devices.
- [ ] Packaging: an npm package and a project template, so apps can live outside this repo.

## Native backend (NativeScript)

- [ ] NativeScript's Node-API runtime is an alpha.
- [ ] Its metadata generator (LLVM 17) misses some declarations in current SDKs, e.g.
      `NSProcessInfo.lowPowerModeEnabled` on macOS.
- [ ] Long synchronous JS still delays main-thread native callbacks; keep work sliced.
      The JS thread must never block on main.
- [ ] The six patches in `nativescript/patches/` haven't been sent upstream.

## Docs

- [ ] A `role="destructive"` swipe action removes the row immediately (SwiftUI), before
      any confirmation: use `tint="red"` when you confirm first.
- [ ] zustand v5: selectors that return new arrays/objects loop; select raw state (or
      use `useShallow`).

## Project

- [ ] Add a license. The vendored NativeScript code is MIT and keeps its own license files.
