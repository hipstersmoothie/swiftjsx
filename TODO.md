# TODO

Known gaps and ideas, roughly by area. Nothing here is scheduled. Most items come from
building the seventeen toy apps in `examples/apps/` (Hacker News, Todos, Weather, Pokédex,
Chat, Flashcards, Settings, Calculator, Kanban, Fitness, Music, Notes, Shop, 2048, Social,
Habits, Recipes): what each one wanted and couldn't do. Checked items are done and kept
for the record.

## Drawing and charts

- [x] Shapes (`Circle`, `Capsule`, `RoundedRectangle`, `Ellipse`, `Rectangle`) with fill,
      stroke, dash and trim; `cornerRadius="capsule"` and per-corner radii.
- [x] Radial and angular gradients, gradient stops.
- [x] Charts: `<Chart>` on Swift Charts (bar, line, area, point, rule, rectangle marks;
      series, stacking, domains, axes, scrub selection).
- [ ] Charts: axis value labels/formatting, y selection, range selection, scrolling
      charts. The Fitness app still draws its charts by hand.
- [ ] Charts: Date `x` values with a `unit` (bars spanning a week), category `y` values,
      `cornerRadius` on `RectangleMark`, styled or view annotations, continuous color
      scales (heatmaps), axis `position` / `gridlines` (the Charts.swift comment promises
      them). `onXSelectionChange` sends Dates as ms; document it.
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
- [x] `relativeWidth` alone no longer forces the full container height (and vice versa);
      `aspectRatio` and relative sizes sit next to `frame`, so backgrounds and corners
      follow them. Several `<Overlay>`s each keep their own `alignment`.
- [ ] Absolute positioning: a `position` prop that's part of layout. With a top-leading
      ZStack + `offset` (2048's tiles), a `scale` transition scales the offset too, every
      layer's `frame` needs `alignment: "topLeading"`, and offsets are points only.
- [ ] Screen size and safe-area insets in `useEnvironment()`; an `ignoresSafeArea` prop
      (rounded or non-background content can't go under the bars); `statusBarHidden`.
- [ ] On a material background, `cornerRadius` rounds the background but doesn't clip
      the content: a rounded clip over a material turns off vibrancy, and hierarchical
      text and dividers on it vanish.
- [ ] A screen-level layer (draw above scroll views that clip, e.g. a dragged card) and
      coordinate spaces for `measure()` and drag events. A root `<Overlay>` sits under the
      navigation and tab bars and under presented sheets (fly-to-cart, toasts), so this
      needs a window-level portal.

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
- [ ] No way to know if `Text` was truncated (an inline "… more"); Markdown links always go
      to the system, with no `onOpenURL` hook for in-app links (`app://user/x`).
- [x] `strikethrough` takes a color, like `underline`.
- [ ] `symbolEffect` doesn't play on an inserted `Image` (only on value changes).
- [ ] Giving a `Text` an `animation` switches its default `contentTransition` to
      `numericText`; document it (or only do so when the text changes).

## Components

- [x] `Menu`, `DatePicker`, `ColorPicker`, `TextEditor`, `NavigationRow`, `EditButton`.
- [x] `TextField` styles, vertical growth, autofocus, keyboard and content types,
      autocapitalization, `submitLabel`, `blurOnSubmit`.
- [ ] Text input: no cursor/selection API, no key events (backspace on an empty field),
      no focus binding shared across fields (moving focus means unmount + `focus()`).
- [x] Buttons: `pressedScale`, `pressedOpacity`, `pressedBackground`, `onPressIn` /
      `onPressOut`.
- [ ] `controlSize`; the Calculator still builds keys from drag gestures.
- [x] `Stepper` with no label is just the −/+ control. `TextField` `textAlignment`. More
      `textContentType`s (card expiry, security code and name; address lines, state).
- [ ] Number pads have no return key: a `ToolbarItemGroup placement="keyboard"`.
- [ ] `Menu` with a custom label view (a styled button that opens a menu); a Button-level
      `onLongPress` that suppresses `onPress`; press/release events on non-Buttons
      (SwiftUI's `onPressingChanged`; hold-to-pause).
- [ ] `<Tab>` takes no modifiers (accessibility identifier, `measure()`, animated badges).
- [x] Page TabView dots: `pageIndicator` ("always" / "never" / "backed").
- [ ] `DatePicker` time-of-day values (`{ hour, minute }`, `minuteInterval`) instead of
      full Dates; `ColorPicker` returns a hex for the current scheme (no `{light, dark}`).
- [ ] `LabeledContent` label as a view (font, icon).
- [ ] `Picker`: `pickerStyle="navigationLink"` and `"wheel"`; infer the value type from
      `options`. `Menu`: checkmark items (Toggle children), colored icons.
- [x] `LabeledContent`.
- [ ] `Label` styles.
- [x] `<Image src>` placeholder/error content (its children, or `placeholder="none"`);
      `redacted` for skeleton loading.
- [ ] Accessibility actions (custom VoiceOver actions, adjustable increments for charts
      and cards).
- [ ] Share sheet (`share({ text, url })`), file export.
- [ ] `Image.prefetch(url)` to warm the cache (next carousel page, next story).

## Lists and scrolling

- [x] `listStyle`, row background / insets / separator / badge, `onDelete` / `onMove`,
      section header/footer views; ScrollView indicators, paging, anchor, margins,
      `onScroll`; `VirtualList` grids (`columns`).
- [x] `List` selection (`selection` / `onSelectionChange`, rows with `tag`).
- [ ] Swipe actions and context menus outside `List` (a `ScrollView` of rows), and on the
      UIKit-backed `VirtualList listStyle="list"`.
- [ ] Over the UIKit list, a large navigation title doesn't collapse into the inline
      title (SwiftUI only tracks its own scroll views); use `titleDisplayMode="inline"`.
      Off iOS, `listStyle="list"` is still SwiftUI's `List`.
- [ ] Without `itemHeight`, `VirtualList.scrollTo(index)` lands on an estimate
      (`estimatedItemHeight`) when rows vary in height.
- [ ] `scrollTo` by offset (`{ x, y }`), and scroll positions readable from worklets.
- [x] `scrollTo` on `List` and `Form` (a row, an index, an edge, or the row holding a
      view). A ScrollView's `scrollTo(n)` is its n-th child (it was treated as a node id).
- [x] Carousels: `onScrollIndexChange` (sent only when the page changes),
      `onScrollPhaseChange` (pause auto-advance while dragging), `paging="view"`
      (snap to children), `defaultScrollAnchor="trailing"`.
- [ ] `onScrollIndexChange` assumes children of equal size (SwiftUI's
      `scrollPosition(id:)` didn't report for our children; worth another look).
- [ ] `VirtualList`: header/footer slots and full-width items in `columns` grids (a home
      screen with chips + carousel + grid can't use it). Slots are matched by index, not
      `keyExtractor`, so inserting rows above moves native state (a carousel's offset) to
      another row. [x] Attachments (`<Overlay>`, `<SafeAreaInset>`…) inside it are kept.

## Navigation and presentation

- [x] Item-based presentations that start fresh each time; sheet dismiss control,
      drag indicator, corner radius, background; toolbar placements; `searchPlacement`.
- [ ] Pushed screens are element snapshots: `nav.push(<X value={v} />)` keeps the props
      it was pushed with. Read changing data from state/stores inside the screen.
- [ ] A navigation ref usable outside a `<Navigator>` (react-navigation's
      `createNavigationContainerRef`), `Navigator.replace`, a `Screen` subtitle.
- [x] `NavigationSplitView` `columnVisibility` / `onColumnVisibilityChange`.
- [ ] Sheets: an "attempted to dismiss" callback (to ask before discarding changes), and
      `interactiveDismissDisabled` settable from inside the sheet's content (a dirty form,
      a game board) rather than only on `<Sheet>`. A `fullScreen` sheet can't be closed
      without its slide (after a custom swipe-down). Sheet content stays mounted (effects
      running) after the first presentation; a "dismissed" event to unmount it.
- [ ] Adding or removing a `<SafeAreaInset>` rebuilds the view it's attached to (resets a
      NavigationStack or scroll position); keep it mounted.
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
- [x] `onDragStart` for immediate drags (with the first event); a cancelled drag's
      `onDragEnd` is decided a turn later, so it can't double-fire whichever order
      SwiftUI resets state and calls `onEnded`.
- [ ] Hardware keyboard: `onKeyPress`, `keyboardShortcut` (arrow keys in 2048 on iPad/Mac).
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
- [x] `withAnimation(spec, fn, completion)`: runs when the animation is logically complete.
- [ ] Exit animations: a removed view can't animate its props first (AnimatePresence);
      apps keep "ghosts" in state and drop them later.
- [ ] Insertion/removal animations come from the parent's `animation`, never the child's
      own; changing the parent's `animation` in the same commit as the insert has no
      effect (React applies child ops before the parent's update).
- [ ] Transitions: asymmetric insert/remove, edges for `move`, a starting scale, blur.
- [ ] Keyframes / phases for React props (`keyframeAnimator`): a 1 → 1.2 → 1 pop, a shake.
      No `requestAnimationFrame`.
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
- [ ] The React Compiler skips a component whose worklet captures a function that reads a
      ref ("Cannot access refs during render"), or that calls `useStore.getState()` in
      render. Hide worklet captures from the compiler; document the zustand idiom.

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
- [ ] Locale: only `navigator.language` is exposed. `locale`, `firstWeekday`,
      `hourCycle` and `timeZone` in `useEnvironment()`, and a significant-time-change event
      (midnight, time zone, DST) instead of every app's own midnight timer.
- [ ] First-party local notifications (and the notification delegate: banners in the
      foreground, taps as deep links), badges, keep-awake and text-to-speech, like
      `haptic()`. Today they need the native backend.
- [x] `hot.data` / `hot.dispose()` for module-level state and cleanup across Fast Refresh
      updates (bundle-wide, not per module).
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
- [ ] Native classes defined in JS (delegates) need an idempotent
      `defineNativeClass(name, { protocols, methods })` that survives Fast Refresh and a
      backend that's off; weak `delegate` properties aren't marked; a
      `nativePromise(done => api(done))` that settles on the JS thread for completion
      handlers on arbitrary queues; whether Objective-C exceptions become JS throws.
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
- [ ] `Intl` works (currency, dates, plural rules). JavaScriptCore has no JIT on iOS: keep
      date-fns `format()` out of hot loops. A `ref` adds `.id(node.id)` to the view.
      `withTiming`'s `delay` stands in for `withDelay`. Native `onMain` calls run in order.

## Project

- [ ] Add a license. The vendored NativeScript code is MIT and keeps its own license files.
