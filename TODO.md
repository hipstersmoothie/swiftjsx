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
- [x] Charts: `onYSelectionChange`, `onXRangeSelectionChange` (two fingers), scrolling
      charts (`xVisibleDomain`, `xScrollPosition`, `onXScrollPositionChange`,
      `xScrollAlignment` snapping to numbers or calendar units).
- [x] The Fitness app's charts are `<Chart>`s now (bars, stacks, ranges, zone-colored
      lines, the sleep timeline). Axis `values` take `{ value, label }` (lane names);
      selections on `xUnit` dates report the bin's start; `PointMark` `symbol` and
      `symbolStroke` (rings); `annotationAlignment`.
- [x] Charts axes: `position`, explicit `values`, `stride` (numbers or `{ unit, count }`),
      `count`, `format` (compact, percent, currency, "{} h", weekday, monthDay…),
      `gridlines` / `ticks` / `labels`. Date `x` with `xUnit` (bars span the day/week).
      `cornerRadius` on every mark. A mark's changed props now redraw the chart (Charts
      skipped marks whose inputs looked unchanged).
- [x] Under a chart `animation`, mark colors change too (style props apply unanimated:
      Swift Charts drops a color change made in an animated transaction).
- [ ] Charts: category `y` values, styled or view annotations, continuous color
      scales (heatmaps); label formats are strings (no format functions); `cornerRadius`
      rounds all four corners (no top-only bars); one line can't change color along its
      length (a series per color run); no minimum bar height.
- [x] `<Path d>` (SVG path data) and `<Polyline points>` in a `viewBox`; `lineCap` /
      `lineJoin`.
- [x] Angular gradient `startAngle` / `endAngle` (arcs, gauges); gradient points as unit
      points (`{ x, y }`) as well as alignments.
- [x] Paths morph: `d` / `points` changes animate when the old and new paths have as
      many segments (lines and quads become cubics); otherwise they switch.
- [x] `<Video>` (AVKit; controls or just the picture, loop, time updates), `<WebView>`
      (URL or HTML, messages from the page, injected JS), `<MapView>` (region, markers,
      annotations with any views, taps, region changes).
- [x] Map overlays (`<MapPolyline>`, `<MapPolygon>`, `<MapCircle>`), `showsUserLocation`,
      `followsUserLocation`, `controls`; `navigator.geolocation` and `useGeolocation()`
      on Core Location (asks for when-in-use permission).
- [x] `<Canvas draw>`: a worklet with a web-style 2D context (paths, arcs, rects, text,
      gradients, transforms, clipping, SF Symbols), redrawn when the shared values it reads
      change or every frame (`continuous`). The Canvas demo has a drawing pad.
- [x] Canvas: `drawImage(url, …)` (draws again once loaded), `measureText`, shadows
      (`shadowColor` / `shadowBlur` / offsets), `globalCompositeOperation` blend modes.
- [ ] Map clustering,
      look-around, directions.

## Layout

- [x] `<Overlay>` / `<Background>` / `<SafeAreaInset>` attachments, `zIndex`,
      `layoutPriority`, `contentShape`, `aspectRatio`, `fixedSize`, `allowsHitTesting`.
- [x] `onLayout`, `relativeWidth` / `relativeHeight`, `Grid` / `GridRow`, `Flow`.
- [ ] Sizes relative to the parent (not the nearest scroll view or screen);
      `onLayout` arrives a frame late on the JS thread, so first frames use guesses.
- [x] `relativeWidth` alone no longer forces the full container height (and vice versa);
      `aspectRatio` and relative sizes sit next to `frame`, so backgrounds and corners
      follow them. Several `<Overlay>`s each keep their own `alignment`.
- [x] `<AbsoluteStack>` with a `position` prop (`{ x, y, width, height, anchor }`, points
      or "25%"): placement is layout, so transitions scale around a child's own frame and
      moves animate; no measuring for fractional boards.
- [x] Window size and safe-area insets in `useEnvironment()`; an `ignoresSafeArea` prop.
- [x] `statusBarHidden`, `persistentSystemOverlays`.
- [x] On a material background, `cornerRadius` clips the content (before the background,
      so hierarchical text and dividers stay vibrant).
- [x] `<Portal alignment interactive>`: a window above everything (sheets, bars) for toasts
      and flying thumbnails; touches pass through unless `interactive`.
- [x] `measure(relativeTo)`: a view's frame within another (drag events already carry local positions).

## Text, color, symbols

- [x] Fonts (sizes, weights, widths, custom fonts with Dynamic Type), `Text` styling,
      styled runs, inline symbols, `markdown`, `selectable`, `contentTransition`.
- [x] Colors: opacity, semantic colors, `{ light, dark }`, hierarchical levels;
      `colorScheme`, `preferredColorScheme`; any element's `tint`.
- [x] SF Symbols: rendering modes, palette colors, variants, `variableValue`,
      `symbolEffect`, replace transitions.
- [x] `loadFont(url)` registers a downloaded (or bundled) font at runtime; no Info.plist entry.
- [x] Runs take `background` (search highlights) and `onPress` (tappable @mentions).
- [x] `onTruncationChange` (an inline "more"); `onOpenURL` takes Markdown links in-app.
- [x] `strikethrough` takes a color, like `underline`.
- [x] `symbolEffect={{ type, onAppear: true }}` plays when the symbol is inserted.
- [x] A `Text` with an `animation` rolls digits by default: documented (README Gotchas).
- [x] `Menu`, `DatePicker`, `ColorPicker`, `TextEditor`, `NavigationRow`, `EditButton`.
- [x] `TextField` styles, vertical growth, autofocus, keyboard and content types,
      autocapitalization, `submitLabel`, `blurOnSubmit`.
- [x] Text input: controlled `focused` (move focus between fields with state),
      `selection` / `onSelectionChange` and `ref.setSelection()` (UTF-16 offsets; insert
      at the cursor), hardware-keyboard `onKeyPress` on fields.
- [x] `onDeleteBackward({ empty })` on fields: the delete key from the software keyboard too,
      in an empty field (OTP boxes step back); UIKit's deleteBackward, swizzled once.
- [x] Buttons: `pressedScale`, `pressedOpacity`, `pressedBackground`, `onPressIn` /
      `onPressOut`.
- [x] `controlSize`, `labelStyle`.
- [x] `Stepper` with no label is just the −/+ control. `TextField` `textAlignment`. More
      `textContentType`s (card expiry, security code and name; address lines, state).
- [x] Number pads have no return key: a `<ToolbarItem placement="keyboard">`'s children
      (and `bottomBar`'s) are a group's items, so a `<Spacer />` spans the bar.
- [x] `<MenuLabel>`: a `Menu`'s label as any view (with `onPress`, tap acts and hold
      opens). Buttons take `systemImage` (icons in menus).
- [x] Button `onLongPress` (a hold doesn't also fire `onPress`; works in List rows).
- [x] `onPressIn` / `onPressOut({ cancelled })`, `pressedScale` / `pressedOpacity` on any
      view (a UIKit recognizer alongside other gestures and scrolling; moving cancels).
- [x] `<Tab>` takes `hidden` and its tab bar item's `accessibilityIdentifier` / `Label` / `Hint`.
- [ ] `<Tab>`: no `measure()` of the tab bar item; badges don't animate.
- [x] Page TabView dots: `pageIndicator` ("always" / "never" / "backed").
- [x] `<TimePicker>` with `{ hour, minute }` values (and `min` / `max`); `minuteInterval`
      snaps the value.
- [x] `TimePicker` `minuteInterval` lists only those minutes on iOS (a UIDatePicker).
- [ ] `ColorPicker` returns a hex for the current scheme (no `{light, dark}`).
- [x] `<LabeledContentLabel>`: a `LabeledContent` label as any view (icon, font).
- [x] `Picker`: wheel, navigationLink and palette styles; number values.
- [x] `Menu` checkmark items: `<Toggle>` children. (Menus draw icons monochrome, as on iOS.)
- [x] `LabeledContent`.
- [x] `<Image src>` placeholder/error content (its children, or `placeholder="none"`);
      `redacted` for skeleton loading.
- [x] `accessibilityActions` + `onAccessibilityAction` (the actions rotor);
      `onAccessibilityIncrement` / `Decrement` (adjustable).
- [x] `share({ text, url })` and `<ShareLink>`. (File export still open.)
- [x] `prefetchImage(url)` warms `<Image>`'s cache (next carousel page, next story).

## Lists and scrolling

- [x] `listStyle`, row background / insets / separator / badge, `onDelete` / `onMove`,
      section header/footer views; ScrollView indicators, paging, anchor, margins,
      `onScroll`; `VirtualList` grids (`columns`).
- [x] `List` selection (`selection` / `onSelectionChange`, rows with `tag`).
- [x] Swipe actions outside a `List` (a ScrollView or stack of rows; iOS): the row slides
      over its actions, full swipes, one open row at a time. (Context menus already work
      anywhere.)
- [x] Swipe actions on the UIKit-backed `VirtualList listStyle="list"` (UIContextualActions
      from the row's `<SwipeActions>`).
- [ ] Over the UIKit list, a large navigation title doesn't collapse into the inline
      title (SwiftUI only tracks its own scroll views); use `titleDisplayMode="inline"`.
      Off iOS, `listStyle="list"` is still SwiftUI's `List`.
- [x] `VirtualList.scrollTo(index)` uses measured row heights (estimates only for rows never laid out).
- [x] `scrollTo({ x, y })` (ScrollView, VirtualList). [ ] Scroll positions readable from worklets.
- [x] `scrollTo` on `List` and `Form` (a row, an index, an edge, or the row holding a
      view). A ScrollView's `scrollTo(n)` is its n-th child (it was treated as a node id).
- [x] Carousels: `onScrollIndexChange` (sent only when the page changes),
      `onScrollPhaseChange` (pause auto-advance while dragging), `paging="view"`
      (snap to children), `defaultScrollAnchor="trailing"`.
- [x] `onScrollIndexChange` works for children of any size (each child's leading edge in
      the content; SwiftUI's `scrollPosition(id:)` and `onScrollTargetVisibilityChange`
      don't report for our children, even with explicit ids).
- [x] `VirtualList` `header` / `footer` (stack style; full width above a `columns` grid).
      The Social feed's stories row and loading footer use them.
- [ ] `VirtualList`: header/footer in the UIKit `listStyle="list"`; full-width items
      inside `columns` grids. Slots are matched by index, not
      `keyExtractor`, so inserting rows above moves native state (a carousel's offset) to
      another row. [x] Attachments (`<Overlay>`, `<SafeAreaInset>`…) inside it are kept.

## Navigation and presentation

- [x] Item-based presentations that start fresh each time; sheet dismiss control,
      drag indicator, corner radius, background; toolbar placements; `searchPlacement`.
- [ ] Pushed screens are element snapshots: `nav.push(<X value={v} />)` keeps the props
      it was pushed with. Read changing data from state/stores inside the screen.
- [x] `createNavigationRef()` + `<Navigator navigationRef>` (push from a notification tap or
      deep link; calls before mount are replayed), `nav.replace`, `<Screen subtitle>`.
- [x] `NavigationSplitView` `columnVisibility` / `onColumnVisibilityChange`.
- [x] Sheets: `onDismissAttempt` (a swipe on a sheet that can't be dismissed: ask "Discard
      changes?"); the Habits form uses it.
- [x] `interactiveDismissDisabled` on any view inside a sheet (a dirty form locks it). A `fullScreen` sheet can't be closed
      without its slide (after a custom swipe-down).
- [x] Sheet content mounts with the presentation and unmounts once the sheet has gone
      (`onDismissed`), so its effects (keep-awake, speech) stop; `keepState` keeps it.
- [x] Showing, hiding or moving a `<SafeAreaInset>` keeps the view it's on (all edges are
      applied once it's in use); one inset per edge.
- [x] Search: `searchActive` / `onSearchActiveChange` (dismiss from code, know about
      Cancel), `onSearchSubmit`, `searchScopes`, `searchSuggestions`.
- [x] `<TabAccessory>` (iOS 26 mini players; Music uses it) and zoom transitions (`transitionSource` + `<Screen zoomFrom>`; Pokédex). [ ] Matched geometry between arbitrary views.

## Gestures and animation

- [x] Worklets, `withAnimation`, animation specs; `animation` covers the subtree.
- [x] Drag events with view-local positions and size.
- [x] `gesturePriority` (simultaneous / high), `dragActivation="longPress"` +
      `onDragStart`, cancelled drags (`onDragEnd` with `cancelled`), tap locations.
- [x] `dragAxis="horizontal" | "vertical"` (iOS): a UIKit pan that only begins along its
      axis, so the other direction scrolls the surrounding ScrollView.
- [x] `onDragStart` for immediate drags (with the first event); a cancelled drag's
      `onDragEnd` is decided a turn later, so it can't double-fire whichever order
      SwiftUI resets state and calls `onEnded`.
- [x] Hardware keyboard: `onKeyPress` (with `keys`), Button `keyboardShortcut`; 2048
      takes arrow keys.
- [ ] Worklets: measuring and reading layout inside worklets ([x] `haptic()` works in worklets),
      animatable shape props (`trim`, `fill`), scroll offsets as shared values.
      Capturing `obj.member` sends all of `obj`; worklets that capture per-render
      closures are re-sent each render (needs stable `runOnJS` targets).
- [x] Worklet animations step on the main thread every frame (a display link while any
      runs): mid-animation reads, `callback(finished)`, `withDecay`, `withDelay`,
      `withSequence`, `withRepeat`, `cancelAnimation`, springs with a starting `velocity`
      (and retargeting keeps speed), `useDerivedValue`, `useAnimatedReaction`. Colors and
      booleans still go to SwiftUI's `withAnimation`.
- [x] Worklet springs take `stiffness` / `damping` / `mass` as well as duration / bounce.
- [ ] Decay has no rubber-banding past `clamp`.
- [x] Transforms: `rotation3D` (card flips), `scaleX` / `scaleY`, `transformAnchor`.
- [x] Animate on appear: `initial={{ opacity, scale, x, y, rotation }}` (+ `initialAnimation`).
- [x] Value-keyed animations: `animationKey` (animate only commits that change it).
- [x] `withAnimation(spec, fn, completion)`: runs when the animation is logically complete.
- [x] `<AnimatePresence exit={…}>`: a keyed child that leaves animates to its exit props,
      then unmounts (`onExitComplete`).
- [x] A transition can carry its own `animation`; an insert or removal in the same commit
      that changes the parent's `animation` uses the new one (React applies child ops
      before the parent's update, so the tree looks ahead).
- [x] Transitions: `{ insert, remove }`, `move` / `push` edges, a starting scale and
      anchor, `offset`, `blur`, `identity`, and a transition's own `animation`.
- [x] `keyframes={{ trigger, steps, repeat }}` (SwiftUI's phase animator): pops, shakes,
      looping wiggles.
- [x] `requestAnimationFrame` (60 Hz on the JS thread, one timestamp per frame).
- [x] Drag and drop anywhere: `draggable` (a string), `onDrop`, `onDropTargetChange`.

## From the Bluesky client

- [x] `VirtualList` `initialScrollIndex` (a thread opens on the focused post, with its
      ancestors above); `Video` `playsWhenVisible` and `poster`; `ScrollView`
      `scrollEnabled`; `searchPlacement` documents that "automatic" can collapse the field
      into a button in an ordinary tab.
- [x] From the high-fidelity pass: `<Screen navigationBar="hidden" tabBar="hidden"
      scrollEdgeEffect>`, `<TabView tabBarMinimizeBehavior>`, `VirtualList stickyHeader`
      (pinned under the bar while `header` scrolls away), `scrollOffset={sharedValue}` on
      ScrollView / VirtualList (scroll-linked worklet styles in the same frame),
      `<Sheet fullScreen zoomFrom>`, `<Portal fullScreen>`, `onSafeAreaChange`. Fixed:
      switching `toolbarBackground` between a fill and "hidden", or setting `subtitle`,
      reset the screen's scroll; an interactive Portal kept taking touches after its
      child unmounted or `interactive` turned off; a Portal directly in a TabView was
      dropped.
- [ ] Bars: `toolbarBackground` can't be a view (a blurred banner); tab items can't be
      custom views (an avatar); `keyframes` can't loop without settling back.
- [ ] Children added later to a paging horizontal ScrollView may not draw (unconfirmed).
- [x] From the second pass: `scrollOffset` carries `dragging` and always sends the final
      offset to JS; `blur`, `clipped`, `scrollDismissesKeyboard`. Fixed: a `scrollTo` was
      replayed when its scroll view appeared again (back from a pushed screen);
      `stickyHeader` with `columns` put the header in a grid cell.
- [ ] `tabBarMinimizeBehavior` doesn't react to vertical lists inside a horizontal paging
      ScrollView (the system picks the scroll view), and stays minimized after a pop.
- [ ] `toolbarColorScheme="dark"` doesn't reach a `Menu` in the toolbar (its icon stays dark).
- [ ] `<Sheet onDismissAttempt>` doesn't fire on the iOS 26.5 simulator: the locked sheet
      stays, but UIKit never reports the attempt (checked with a proxy delegate, a re-wrapped
      delegate, and a hook on SwiftUI's delegate class; none is called). testHabits' discard
      step fails, so it's left out of CI. It worked on earlier iOS builds.
- [ ] A container's `accessibilityIdentifier` disappears when it's nested inside another
      `accessibilityElement="contain"` container (XCUITest sees only the outer one).
- [ ] `TextField` can't style ranges of its text (highlighting mentions and links while
      composing).
- [ ] Gesture props (`dragAxis`, enabled) can't be driven by shared values: switching them
      from a worklet takes a round trip through React.
- [x] `VirtualList maintainVisibleContentPosition`: rows inserted above the top visible
      row don't move it (new posts above a feed you're reading); it follows the row's
      measured position while the new rows settle.

## App kit

- [x] All 18 example apps moved onto the kit (toast, ContentUnavailable, Avatar, Chip,
      Badge, ProgressRing, Pager, `format`, `useNow`, `<Text date>`), dropping about
      1,200 lines of per-app copies.
- [x] Gaps the migration found, filled: `format.compact({ from, digits })`,
      `duration(…, "abbreviated")`, `bytes(0)` → "Zero KB", `relativeTime({ weeks })`,
      weekdays ahead in `relativeDay`, compact counts; `useNow({ active })`; toast
      `position` (incl. "center"); Avatar `design`, `cornerRadius`, `outline`, a symbol
      fallback and one-letter initials for one word; IconTile `glyphScale`; Chip `ref` and
      unselected colors; ProgressRing `lineCap`; PageIndicator `dotSize` / `spacing`; Pager
      `indicatorInactive`; ContentUnavailable `symbolColor` and `description` with `search`;
      `onInitialEnd`; keyframes `delay`.
- [ ] Still custom in the apps: ContentUnavailable with a custom image (chat's avatar) or
      fonts (Bluesky's Inter); themed toasts; a Badge in other sizes (shop's discount tag);
      Chip borders and fonts; Instagram's shrinking far dots.
- [ ] `initial` and `keyframes` values multiply the view's own (`opacity` can't go above
      the real one), so a dot that brightens on its turn needs a cover.
- [ ] Not built yet: a form sheet with a discard guard, color swatch and symbol pickers, a
      zoomable image viewer, a side drawer, a month calendar, Sheet lazy content and
      `onPresented`, live props on pushed screens, weekday notification triggers, a share
      button anchor.

## Rendering

- [ ] `foregroundStyle`, gestures, transforms, accessibility props and refs are attached
      the first time a view uses them and then stay (always-on, idle gestures doubled
      scroll hitches in long lists). So the *first* time one of them appears on a view
      that's already mounted, that view's SwiftUI state resets once (a text field inside
      it loses focus). Props present from mount never reset it. `foregroundStyle` has no
      no-op form: `.foregroundStyle(.foreground)` and the three-level
      `.foregroundStyle(.primary, .secondary, .tertiary)` both turn a List's gray
      headers black.
- [x] Modifier props on a `Section` style each of its rows (`tint`, `listRowBackground`,
      `font`…) instead of wrapping it (which stopped it being a section).
- [x] Worklets no longer make the React Compiler skip components: the worklets pass runs
      after the compiler (a pre-pass marks `useAnimatedStyle` callbacks), so worklets are
      memoized like any callback and stop being re-sent every render. The runtime, the
      seventeen apps and the test fixtures compile with no skipped functions. The zustand
      idiom and the compiler's known bug are in the README's Gotchas.

## Web APIs and platform

- [x] `fetch`, `WebSocket`, `URL`, encoding, crypto, storage, events, clipboard,
      `haptic()`, `openURL` / `canOpenURL`, `useEnvironment()`.
- [x] Streaming responses: fetch resolves at the headers and `response.body` is a
      `ReadableStream` of chunks as they arrive (readers, async iteration, tee). `FormData`
      bodies (multipart, with `File`s). URLSession buffers the first 512 bytes of
      `text/plain` and unlabeled responses to sniff them; `text/event-stream` and JSON stream.
- [x] `XMLHttpRequest` (async; upload and download progress, timeouts, response types) on
      fetch; fetch's `onUploadProgress` (a SwiftJSX extension); `formData()` parses
      multipart bodies. Native code read typed-array views from the start of their
      buffer (`bytes.subarray(4)` sent the wrong bytes); fixed.
- [ ] Byte streams / BYOB readers.
- [x] `localStorage` saves to a JSON file in the background (coalesced, flushed when the
      app leaves the foreground), with a quota (`QuotaExceededError`).
- [x] `AsyncStorage` (React Native's API): files per key, off the main and JS threads.
- [x] `URL`: hosts are checked like WHATWG's (forbidden code points fail instead of being
      percent-encoded; percent-decoded and lowercased), tabs and newlines are dropped.
- [ ] `URL` still differs from WHATWG at the edges (Foundation underneath): no IDNA /
      punycode hosts, backslashes aren't slashes, `https:///host` fails instead of
      skipping the extra slash, IPv4 shorthand (`http://0x7f.1`) isn't normalized.
- [x] `pagehide` / `pageshow` window events, with background time for saves in pagehide
      handlers. (No `document`, by design.)
- [x] `useEnvironment().locale` (identifier, language, region, `weekStartsOn`, `hourCycle`,
      time zone, calendar) and a window "timechange" event (midnight, time zone, clock).
- [x] First-party `notifications` (SwiftJSX owns the delegate: banners in the foreground,
      taps as events, a launch tap held until someone listens), badge, `speech` (with word
      ranges, ducking other audio) and `useKeepAwake`. Recipes uses them instead of its
      NativeScript code.
- [x] Notification categories with action buttons (destructive, foreground, text input
      replies as `text`, icons, a "dismiss" response), `attachments` (downloaded first),
      `interruptionLevel` (passive / time-sensitive / critical), `relevance`. Recipes'
      timers have "Remind Me in 1 Minute".
- [x] `hot.data` / `hot.dispose()` for module-level state and cleanup across Fast Refresh
      updates (bundle-wide, not per module).
- [x] `TextDecoder`: streaming (`{ stream: true }` keeps split characters), UTF-16 LE / BE,
      windows-1252 (and the Latin-1 / ASCII labels, as browsers do).
- [x] `WritableStream`, `TransformStream`, `TextDecoderStream`, `TextEncoderStream`,
      `pipeTo` / `pipeThrough`, `ReadableStream.from`.
- [ ] WebSocket has no extensions or ping control; no `document` (by design).

## Native backend (NativeScript)

- [x] Using an SDK class as a bare global (`AVPlayer.new()`, which typechecks because the
      type files declare globals) fails the build with "use native.AVPlayer".
- [x] `onJS(fn)` / `toJS(fn)`: from a native callback (on main) back to the JS thread.
- [x] `observeKeyPath(object, keyPath, callback)`: KVO, delivered on the JS thread.
- [ ] Generated types: inconsistent enum member names, nullable values typed non-null,
      no inline helpers (`CGRectMake`), no instance type aliases, clumsy NSError
      out-parameters. Which frameworks need main isn't documented beyond UIKit/AppKit.
- [x] `<NativeView create>`: a UIView / NSView made with the native backend, hosted in
      SwiftUI (the Media demo's AirPlay picker).
- [ ] `<Image>`'s cache isn't shared with native code.
- [x] Apps declare Info.plist keys and capabilities in their own `ios/project.yml` /
      `Info.plist` / entitlements (the template README shows how).
- [x] `defineNativeClass(name, { protocols, methods, exposed })` (registered once, lazily;
      Fast Refresh swaps method bodies), `keepAlive()` for weak delegates, and
      `nativePromise()` for completion handlers on any queue.
- [x] Objective-C exceptions inside native calls throw in JS (libffi rebuilt with unwind
      info), and callbacks into a destroyed JS context are ignored instead of crashing.
      See `nativescript/patches/README.md`.
- [ ] NativeScript's Node-API runtime is an alpha; its metadata generator (LLVM 17)
      misses some declarations in current SDKs. Long synchronous JS still delays
      main-thread native callbacks. The patches in `nativescript/patches/` haven't
      been sent upstream.

## Build and tooling

- [x] React Compiler bail-outs are console warnings in development builds.
- [ ] The React Compiler runs on Babel 7. Checked against Babel 8.0.9 (October 2026):
      both 1.0 and the May 2026 experimental build fail on valid code there (39–50
      functions in this repo; destructuring defaults, "Expected value kind to be
      initialized"), while on Babel 7 both compile everything. The `Math.max(0,
      list.findIndex(cb))` internal error is still in the experimental build.
- [x] CI (GitHub Actions, Xcode 26): typecheck, bundles up to date, `swift test`, the
      packaged template, the iOS demo build. Builds with Xcode 26 and 27.
- [x] React DevTools: the standalone app (`npx react-devtools`) over WebSocket, in the
      development runtime only (it adds ~0.9 MB and ~60 ms to a development launch).
- [x] UI tests in CI: twelve that don't need the network (`scripts/ui-tests.sh`, which also
      works around the hang below and "0 tests executed" runs); the result bundle is
      uploaded when they fail. The network ones (the toy apps' live APIs) run locally.
- [ ] `xcodebuild test` hangs after the UI tests finish (an Xcode quirk while writing
      the results); it has to be stopped once it prints "Executed N tests".
- [x] Hot reload on devices: `npm run dev` serves the bundle (long polling, port 8081);
      Debug builds connect over the local network and fall back to the bundled app.js.
- [x] Packaging: the `swiftjsx` npm package (`create`, `dev`, `build`; declarations in
      dist/types) and a project template; tested from a packed tarball outside the repo.
- [ ] Publish `swiftjsx` to npm (until then, `npm pack` this repo or use `--swiftjsx <path>`).

## Docs

- [x] Gotchas written up in the README (React Compiler eager closures, Fast Refresh effects,
      zustand selectors, List-row buttons, destructive swipes, tinted buttons, identifier
      inheritance, refs and identity, numeric text, `Intl` and the missing JIT, worklet
      delays, native ordering and weak delegates).

## Project

- [x] MIT license. The vendored NativeScript code is MIT and keeps its own license files.
