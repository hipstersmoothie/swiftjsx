# TODO

Known gaps and ideas, roughly by area. Nothing here is scheduled. Most items come from
building the twelve toy apps in `examples/apps/` (Hacker News, Todos, Weather, Pokédex,
Chat, Flashcards, Settings, Calculator, Kanban, Fitness, Music, Notes): what each one
wanted and couldn't do. Checked items are done and kept for the record.

## Drawing and charts

- [x] Shapes (`Circle`, `Capsule`, `RoundedRectangle`, `Ellipse`, `Rectangle`) with fill,
      stroke, dash and trim; `cornerRadius="capsule"` and per-corner radii.
- [x] Radial and angular gradients, gradient stops.
- [x] Charts: `<Chart>` on Swift Charts (bar, line, area, point, rule, rectangle marks;
      series, stacking, domains, axes, scrub selection).
- [ ] Charts: axis value labels/formatting, y selection, range selection, scrolling
      charts. The Fitness app still draws its charts by hand.
- [x] `<Path d>` (SVG path data) and `<Polyline points>` in a `viewBox`; `lineCap` /
      `lineJoin`.
- [ ] Angular gradient start/end angles; animating between paths (morphing).
- [ ] `Canvas`, maps (MapKit), video (AVKit), web views.

## Layout

- [x] `<Overlay>` / `<Background>` / `<SafeAreaInset>` attachments, `zIndex`,
      `layoutPriority`, `contentShape`, `aspectRatio`, `fixedSize`, `allowsHitTesting`.
- [x] `onLayout`, `relativeWidth` / `relativeHeight`, `Grid` / `GridRow`, `Flow`.
- [ ] Sizes relative to the parent (not the nearest scroll view or screen);
      `onLayout` arrives a frame late on the JS thread, so first frames use guesses.
- [ ] On a material background, `cornerRadius` rounds the background but doesn't clip
      the content: a rounded clip over a material turns off vibrancy, and hierarchical
      text and dividers on it vanish.
- [ ] A screen-level layer (draw above scroll views that clip, e.g. a dragged card) and
      coordinate spaces for `measure()` and drag events.

## Text, color, symbols

- [x] Fonts (sizes, weights, widths, custom fonts with Dynamic Type), `Text` styling,
      styled runs, inline symbols, `markdown`, `selectable`, `contentTransition`.
- [x] Colors: opacity, semantic colors, `{ light, dark }`, hierarchical levels;
      `colorScheme`, `preferredColorScheme`; any element's `tint`.
- [x] SF Symbols: rendering modes, palette colors, variants, `variableValue`,
      `symbolEffect`, replace transitions.
- [ ] Custom font files: fonts must be bundled and listed in the app's Info.plist;
      there's no runtime registration.
- [ ] Runs can't have a background (search highlights) or their own tap handler.

## Components

- [x] `Menu`, `DatePicker`, `ColorPicker`, `TextEditor`, `NavigationRow`, `EditButton`.
- [x] `TextField` styles, vertical growth, autofocus, keyboard and content types,
      autocapitalization, `submitLabel`, `blurOnSubmit`.
- [ ] Text input: no cursor/selection API, no key events (backspace on an empty field),
      no focus binding shared across fields (moving focus means unmount + `focus()`).
- [x] Buttons: `pressedScale`, `pressedOpacity`, `pressedBackground`, `onPressIn` /
      `onPressOut`.
- [ ] `controlSize`; the Calculator still builds keys from drag gestures.
- [ ] `Picker`: `pickerStyle="navigationLink"` and `"wheel"`; infer the value type from
      `options`. `Menu`: checkmark items (Toggle children), colored icons.
- [ ] `LabeledContent` ("Title … value" rows), `Label` styles.
- [ ] `<Image src>`: placeholder and error content (today a gray box / "photo" symbol).
- [ ] `redacted(.placeholder)` for skeleton loading.
- [ ] Accessibility actions (custom VoiceOver actions, adjustable increments for charts
      and cards).
- [ ] Share sheet (`share({ text, url })`), file export.

## Lists and scrolling

- [x] `listStyle`, row background / insets / separator / badge, `onDelete` / `onMove`,
      section header/footer views; ScrollView indicators, paging, anchor, margins,
      `onScroll`; `VirtualList` grids (`columns`).
- [ ] `List` selection (iPad sidebars).
- [ ] Swipe actions and context menus outside `List` (a `ScrollView` of rows), and on the
      UIKit-backed `VirtualList listStyle="list"`.
- [ ] Over the UIKit list, a large navigation title doesn't collapse into the inline
      title (SwiftUI only tracks its own scroll views); use `titleDisplayMode="inline"`.
      Off iOS, `listStyle="list"` is still SwiftUI's `List`.
- [ ] Without `itemHeight`, `VirtualList.scrollTo(index)` lands on an estimate
      (`estimatedItemHeight`) when rows vary in height.
- [ ] `scrollTo` by offset (`{ x, y }`), and scroll positions readable from worklets.

## Navigation and presentation

- [x] Item-based presentations that start fresh each time; sheet dismiss control,
      drag indicator, corner radius, background; toolbar placements; `searchPlacement`.
- [ ] Pushed screens are element snapshots: `nav.push(<X value={v} />)` keeps the props
      it was pushed with. Read changing data from state/stores inside the screen.
- [ ] A navigation ref usable outside a `<Navigator>` (react-navigation's
      `createNavigationContainerRef`), `Navigator.replace`, a `Screen` subtitle.
- [ ] `NavigationSplitView` `columnVisibility`.
- [ ] Sheets: an "attempted to dismiss" callback (to ask before discarding changes).
- [ ] Search: `isSearching`, dismiss from code, submit / cancel events, scopes,
      suggestions.
- [ ] iOS 26 `tabViewBottomAccessory` (mini players); zoom transitions / matched geometry.

## Gestures and animation

- [x] Worklets, `withAnimation`, animation specs; `animation` covers the subtree.
- [x] Drag events with view-local positions and size.
- [x] `gesturePriority` (simultaneous / high), `dragActivation="longPress"` +
      `onDragStart`, cancelled drags (`onDragEnd` with `cancelled`), tap locations.
- [ ] Drag axis locking inside scroll views (a horizontal drag that leaves vertical
      scrolling alone needs `gesturePriority="simultaneous"` plus your own axis check).
- [ ] Worklets: measuring and reading layout inside worklets, haptics from worklets,
      animatable shape props (`trim`, `fill`), scroll offsets as shared values.
      Capturing `obj.member` sends all of `obj`; worklets that capture per-render
      closures are re-sent each render (needs stable `runOnJS` targets).
- [ ] Worklet animations are SwiftUI animations: no reading values mid-animation, no
      completion callbacks, `withDecay`, `withRepeat` or `withSequence`; no
      `useDerivedValue` / `useAnimatedReaction`; springs don't take the finger's velocity.
- [ ] Transforms: `rotation3DEffect` (card flips), x/y scale, anchors.
- [ ] Value-keyed animations and "animate on appear" (a state change in a mount effect can
      land in the same frame as the mount and not animate).
- [ ] Drag and drop between containers (drop targets) outside `List`.

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

## Web APIs and platform

- [x] `fetch`, `WebSocket`, `URL`, encoding, crypto, storage, events, clipboard,
      `haptic()`, `openURL` / `canOpenURL`, `useEnvironment()`.
- [ ] Streams: no `ReadableStream`; `fetch` bodies are buffered (no streaming responses
      or upload progress). No `FormData` bodies, no `XMLHttpRequest`.
- [x] `localStorage` saves to a JSON file in the background (coalesced, flushed when the
      app leaves the foreground), with a quota (`QuotaExceededError`).
- [ ] An async storage API for larger data (IndexedDB-like, or a key-value file store).
- [ ] `URL` parsing goes through Foundation, which is more lenient than WHATWG
      (percent-encodes spaces instead of failing).
- [ ] App lifecycle: no `pagehide` / background-task time for last-chance saves; no
      `document.visibilityState`.
- [ ] Fast Refresh re-runs whole modules: module-level state resets and native objects
      created there leak. Wants an `import.meta.hot.dispose`-style hook.
- [ ] `TextDecoder` is UTF-8 only and has no streaming mode; WebSocket has no
      extensions or ping control; no `document` (by design).

## Native backend (NativeScript)

- [x] Using an SDK class as a bare global (`AVPlayer.new()`, which typechecks because the
      type files declare globals) fails the build with "use native.AVPlayer".
- [x] `onJS(fn)` / `toJS(fn)`: from a native callback (on main) back to the JS thread.
- [ ] No KVO observing (AVPlayer status, outputVolume…); apps poll.
- [ ] Generated types: inconsistent enum member names, nullable values typed non-null,
      no inline helpers (`CGRectMake`), no instance type aliases, clumsy NSError
      out-parameters. Which frameworks need main isn't documented beyond UIKit/AppKit.
- [ ] Native UIViews can't be embedded (MPVolumeView, AVRoutePickerView); `<Image>`'s
      cache isn't shared with native code.
- [ ] Apps can't declare capabilities or Info.plist keys (background audio).
- [ ] NativeScript's Node-API runtime is an alpha; its metadata generator (LLVM 17)
      misses some declarations in current SDKs. Long synchronous JS still delays
      main-thread native callbacks. The six patches in `nativescript/patches/` haven't
      been sent upstream.

## Build and tooling

- [x] React Compiler bail-outs are console warnings in development builds.
- [ ] The React Compiler runs on Babel 7: `babel-plugin-react-compiler` 1.0 is built
      against Babel 7's AST, and under Babel 8 it rejects some valid code. It also hit an
      internal error on one function in the Weather app (left unmemoized).
- [ ] React DevTools support. CI for `swift test` and the XCUITest suite.
- [ ] `xcodebuild test` hangs after the UI tests finish (an Xcode quirk while writing
      the results); it has to be stopped once it prints "Executed N tests".
- [ ] Hot reload only works in the simulator (it reads `build/app.js` from the host).
      Serve the bundle over the network for devices.
- [ ] Packaging: an npm package and a project template, so apps can live outside this repo.

## Docs

- [ ] React Compiler: a closure's dependencies are read eagerly, so `a!.b` inside a
      callback crashes when `a` is null (the Kanban app hit this). Use `a?.b`.
- [ ] A `role="destructive"` swipe action removes the row immediately (SwiftUI), before
      any confirmation: use `tint="red"` when you confirm first.
- [ ] Several default-style Buttons in one List row all fire on a tap (SwiftUI); give
      inner buttons a `buttonStyle`.
- [ ] Inside a tinted Button, `secondary` is relative to the tint; use `secondaryLabel`.
- [ ] `accessibilityIdentifier` on a container is copied to its children unless it has
      `accessibilityElement="contain"`.
- [ ] Effects' cleanups run on Fast Refresh; zustand v5 selectors that return new
      arrays loop (select raw state, or `useShallow`).

## Project

- [ ] Add a license. The vendored NativeScript code is MIT and keeps its own license files.
