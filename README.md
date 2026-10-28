# SwiftJSX (experimental)

[![CI](https://github.com/hipstersmoothie/swiftjsx/actions/workflows/ci.yml/badge.svg)](https://github.com/hipstersmoothie/swiftjsx/actions/workflows/ci.yml)

Write SwiftUI apps in React + JSX + hooks. Real React (19.3) runs in JavaScriptCore;
a custom renderer turns React's commits into native SwiftUI views.

```tsx
function Inbox() {
  const nav = useNavigation();
  const [composing, setComposing] = useState(false);
  return (
    <Screen title="Inbox">
      <ToolbarItem placement="primaryAction">
        <Button onPress={() => setComposing(true)}><Image systemName="square.and.pencil" /></Button>
      </ToolbarItem>
      <VirtualList
        data={messages}
        renderItem={(m) => <Text onTapGesture={() => nav.push(<Message id={m.id} />)}>{m.subject}</Text>}
      />
      <Sheet isPresented={composing} onDismiss={() => setComposing(false)} detents={["medium"]}>
        <Compose />
      </Sheet>
    </Screen>
  );
}
```

## Start an app

```sh
npx swiftjsx create MyApp    # src/App.tsx, an XcodeGen iOS project, package.json
cd MyApp && npm install
npm run dev                  # serves the app to the simulator and devices; keep it running
open ios/MyApp.xcodeproj     # run it; edits to src/ apply live
```

`swiftjsx dev` rebuilds on save and serves the bundle on port 8081; `swiftjsx build`
writes `build/app.js` and `build/app.production.js` (Release builds bundle the latter).
The Swift side comes from this repo as a Swift package. Needs XcodeGen
(`brew install xcodegen`) and Node 20+.

## Run this repo

```sh
npm install
npm run dev          # watches; writes build/app.js (+ the runtime and test fixtures), serves it
npm run build        # one-off; also writes the production runtime and build/app.production.js
swift run Demo       # macOS window; edits apply live via React Refresh
swift test           # headless tests driving fixtures through real React
```

Optional: the `native` backend (all of the SDK from JS) needs NativeScript's add-on, built
once with `scripts/build-nativescript.sh` (10–20 min; see [Native APIs](#native-apis)).
`swift run Demo`, `swift test` and the iOS app pick it up automatically when it's there.

iOS: see [`Apps/iOS/README.md`](Apps/iOS/README.md) (XcodeGen project; the simulator
build reads `build/app.js` from the repo, so Fast Refresh works there too).

## Features

- **Hooks are just React.** `useState`, `useReducer`, `useEffect`, context, custom hooks,
  transitions — anything that works in react-dom.
- **Web APIs.** `fetch` (with `AbortController`; streaming `response.body`, `FormData` uploads), `XMLHttpRequest`
  (upload progress), `WebSocket`, `URL`/`URLSearchParams`, `TextEncoder`/`TextDecoder` (streaming; UTF-8,
  UTF-16, Latin-1), streams (`ReadableStream`, `WritableStream`, `TransformStream`,
  `TextDecoderStream`), `atob`/`btoa`, `structuredClone`, `crypto.getRandomValues`
  and `randomUUID`, `localStorage`/`sessionStorage`, `navigator.geolocation`, `EventTarget`. Networking runs on
  `URLSession` off the JS thread; `window` fires `focus`, `visibilitychange`, `online` and
  `offline` from the app's lifecycle. There's no DOM (`document`).
- **npm packages.** Install and import them as usual; the build bundles them. Tested here:
  zustand (with `persist` to `localStorage`), jotai, TanStack Query, SWR, axios, zod,
  date-fns, immer and nanoid.
- **React Compiler.** All your components and hooks (and the library's) are auto-memoized
  at build time — no `memo`, `useMemo` or `useCallback` needed. The build prints
  `React Compiler → build/app.js: 10 memoized, 0 skipped`, plus the file, line and reason
  for anything it had to leave unmemoized (rule-of-React violations, unsupported syntax).
- **Fast Refresh.** Save a file: changed components are swapped in place and keep their
  state. Changing a component's hooks remounts just that component. Syntax/runtime errors
  show a red box and clear on the next good save. Module-level state re-runs on each
  update: keep it with `hot.data` (`export const useStore = (hot.data.store ??= create(…))`)
  and stop timers, sockets or native objects with `hot.dispose(fn)`. On devices too:
  `npm run dev` serves the app on port 8081, and Debug builds (`JSXRuntime.app()`) load it
  from the Mac over the local network, falling back to the bundled app.js when it's not
  running. A failed build shows its errors in the app.
- **React DevTools.** Run `npx react-devtools` on the Mac: development builds connect to it
  (the dev server's host, or loopback in the simulator) and show the component tree, props,
  state and hooks, and profile renders. Not in production builds.
- **JS off the main thread.** React renders on a dedicated JS thread (with its own run
  loop); commits are applied on the main thread. Controlled inputs stay smooth: a field shows its own value while React
  catches up, and stale echoes are dropped by sequence number (like React Native's
  `mostRecentEventCount`). `JSXRuntime(threading: .main)` runs everything synchronously
  (used by the tests).
- **Production builds.** `npm run build` also writes `build/app.production.js`: React's
  production build, minified, without Fast Refresh. The runtime it needs is 153 KB, against
  918 KB for development. `JSXRuntime` picks the matching runtime from the bundle, and
  Release builds of the iOS app ship the production bundle.
- **Navigation.** `<Navigator>` + `useNavigation()` (`push(<Screen…/>)`, `pop`, `popToRoot`)
  on a real `NavigationStack` — swipe-back works and is reported back to React.
  `<Screen title>` + `<ToolbarItem>` set the title and toolbar.
- **Lists and search.** `onRefresh` (pull to refresh; the spinner waits for your
  promise), `onEndReached` on `VirtualList`, `<SwipeActions>` and `<ContextMenu>` children
  on rows, and `searchText`/`onSearchTextChange` on `<Screen>` for the search field.
  `openURL(url, { inApp })` opens links in Safari or an in-app Safari sheet.
- **Tabs and split views.** `<TabView selection onSelectionChange>` with `<Tab title
  systemImage badge>` children (controlled or not; `tabViewStyle="page"` for a pager).
  `<NavigationSplitView sidebar={…} detail={…}>` shows columns on iPad and Mac and a stack
  on iPhone, where `preferredCompactColumn` decides which column is showing.
- **Presentations.** Declarative `<Sheet>` (detents, full-screen on iOS), `<Alert>`,
  `<ConfirmationDialog>` driven by `isPresented` / `onDismiss`. They anchor to their parent
  element: nest a `<ConfirmationDialog>` inside the button that opens it, and its popover
  points there.
- **Lists.** `LazyVStack`, `LazyHStack`, `LazyVGrid`, and `<VirtualList>`: lazy slots for
  `data.length` rows; React renders only the visible rows plus a lead of about two screens
  in the scroll direction. Pass `itemHeight` for uniform rows (like FlatList's
  `getItemLayout`). On an iPhone 15 Pro Max at 120 Hz, 100k rows scroll at 118–120 fps
  with no blank rows, from the top or after `scrollTo(50_000)` (`Apps/iOS` has a
  benchmark). `scrollTo(index)` jumps straight to the offset, so even a jump to row
  50,000 is instant. `listStyle="list"` gives the inset-grouped list look; on iOS it's a
  `UICollectionView` list hosting your rows, just as fast at any depth.
- **Refs.** `ref.current.focus()`, `.blur()`, `.scrollTo(ref | index | "top" | "end")`,
  `await .measure()`. `useImperativeHandle` etc. work as usual on top.
- **Modifiers are props**, applied CSS-box-model style:
  `padding → frame → background → cornerRadius → border → shadow → opacity → offset/scale/rotation`.
  `animation="spring"` animates a node's changes; children can set `transition`. Setting or
  clearing a prop never resets a view's state: a text field keeps focus, a scroll view
  its position.
- **Gestures.** `onTapGesture`, `onDoubleTap`, `onLongPress`, `onDrag`/`onDragEnd`
  (translation, location, velocity, predicted end), `onMagnify`, `onRotate`. Handlers run
  on the JS thread like any event, or on the main thread as worklets (below).
- **Animation.** `withAnimation("spring", () => setOpen(true))` animates everything that
  update changes, like SwiftUI's `withAnimation`; the `animation` prop animates one view.
  Both take SwiftUI's curves (`spring`, `bouncy`, `snappy`, `easeInOut`…) or
  `{ type, duration, bounce, delay, repeatCount }`. `withAnimation(spec, fn, done)` calls
  `done` when it finishes. `transition` takes `{ insert, remove }` and options (edge,
  scale, its own `animation`); `<AnimatePresence exit={…}>` animates leaving children to
  exit props before unmounting them; `<AbsoluteStack>` places children by `position`
  (points or percentages) as layout, so moves animate.
- **Worklets** (like Reanimated). A handler marked `"worklet"` runs on the main thread
  inside the touch event, so a dragged view moves in the same frame as the finger, with
  no React render:

  ```tsx
  const offset = useSharedValue({ x: 0, y: 0 });
  const style = useAnimatedStyle(() => ({ offset: offset.get() }));
  <VStack
    animatedStyle={style}
    onDrag={(e) => { "worklet"; offset.set(e.translation); }}
    onDragEnd={() => { "worklet"; offset.set(withSpring({ x: 0, y: 0 })); runOnJS(save)(); }}
  />
  ```

  The build compiles worklets to source plus the values they capture; a small second
  JSContext on the main thread runs them.
  - Animations: `withTiming`, `withSpring` (with a starting `velocity`, e.g. a drag's;
    interrupting a moving value keeps its speed), `withDecay` (flicks, with `clamp`),
    `withDelay`, `withSequence`, `withRepeat` (`-1`: forever; `reverse` for pulses and
    wiggles) and `cancelAnimation`. They step on the main thread every frame (a display
    link runs while one is running), so worklets read mid-animation values, and each
    takes a `callback(finished)` (a worklet, or a JS function that runs on the JS thread).
    Numbers and objects or arrays of numbers animate this way; colors and booleans are
    handed to SwiftUI, which animates them natively.
  - `useDerivedValue(() => …)` and `useAnimatedReaction(prepare, react)` re-run on the main
    thread when the shared values they read change.
- **`<Canvas draw>`**: immediate-mode drawing with a web-style 2D context (paths, `arc`,
  `fillRect`, `fillText`, gradients, transforms, `drawImage` for SF Symbols). `draw` is a
  worklet: it draws again when its size or the shared values it reads change (animate
  them and the drawing follows), or every frame with `continuous`.
- **Shapes, colors and fonts.**
  - Shapes: `<Circle>`, `<Capsule>`, `<RoundedRectangle>`, `<Ellipse>`, `<Rectangle>`
    with `fill`, `stroke`, `lineWidth`, `dash` and `trim` (progress rings).
    `cornerRadius` takes a number, `"capsule"`, or one radius per corner.
  - Colors: names, hex, opacity (`"blue/20"`), iOS system colors (`systemBackground`,
    `secondaryLabel`, `separator`…), and `{ light, dark }` pairs. `secondary` …
    `quinary` are levels of the surrounding style, as in SwiftUI.
  - Fills: `background`, `foregroundStyle` and shape fills take colors, materials, and
    linear, radial or angular gradients with stops. `colorScheme` forces light or dark
    for a subtree; `Screen` takes `toolbarBackground` and `toolbarColorScheme`.
  - Fonts: text styles or `{ size, weight, design, width }`, and custom fonts
    (`{ name, size, relativeTo }`, scaled with Dynamic Type). `Text` takes `lineLimit`,
    `minimumScaleFactor`, `textCase`, `kerning`, `underline`, and nested `<Text>` runs
    and `<Image systemName>` symbols inline. Controls take `tint`.
- **Images.** `<Image systemName>` (SF Symbols), `<Image name>` (asset catalog), and
  `<Image src="https://…" contentMode="fill">`. URL images are cached in memory, requested
  once even when several views want them, and decoded off the main thread. They fire
  `onLoad`/`onError`.
- **Platform services.** `haptic()`, `navigator.clipboard`, `openURL`; local
  `notifications` (permission, `schedule({ title, at | seconds, data })`, cancel, badge,
  action buttons via `setCategories` (text replies too), attachments, time-sensitive
  delivery, and tap/arrival listeners, including the tap that launched the app); `speech.speak(text,
  { onWord })` (text-to-speech with word ranges); `useKeepAwake()`. No native backend needed.
- **Accessibility.** `accessibilityLabel`, `Hint`, `Value`, `Hidden`, `Identifier` (for UI
  tests, like `testID`), `Traits`, `SortPriority`, and `accessibilityElement="combine"`.

## Native APIs

Opt in with `JSXRuntime(…, native: .embedded)` (iOS app with the add-on embedded) or
`NativeOptions(addonURL:)`, and JS gets every Objective-C class, protocol, C function and
constant in the SDK, fully typed, via [NativeScript](https://github.com/NativeScript/napi-ios)'s
Node-API runtime running in SwiftJSX's own JavaScriptCore VM:

```tsx
import { native, onMain, useNativeValue } from "swiftjsx";

function Battery() {
  // UIDevice is @MainActor: useNativeValue reads on main, refreshes on the notification.
  const level = useNativeValue(() => native.UIDevice.currentDevice.batteryLevel,
    { notifications: "UIDeviceBatteryLevelDidChangeNotification" });
  const buzz = () => onMain(() => native.UIImpactFeedbackGenerator.alloc().initWithStyle(1).impactOccurred());
  return <Button title={`${Math.round((level ?? 0) * 100)}%`} onPress={buzz} />;
}
```

- **Classes from JS.** `defineNativeClass(name, { protocols, methods, exposed })` makes a
  delegate or target-action class: registered once per process (on first `new()`, so it's
  safe at module level with the backend off) and updated in place by Fast Refresh.
  `keepAlive(obj)` holds delegates (those properties are weak); `nativePromise((resolve,
  reject) => …)` turns a completion handler on any queue into a Promise that settles on
  the JS thread. `observeKeyPath(object, keyPath, fn)` is KVO (AVPlayer status, volume).
  Compare native objects with `a.isEqual(b)`: wrappers and `interop.handleof` aren't stable
  identities across calls. An Objective-C exception inside a native call throws in JS with its
  reason, and native objects that call back after their runtime is gone are ignored.
- **Native views.** `<NativeView create={() => native.AVRoutePickerView.new()} frame={…} />`
  hosts a UIView (NSView on macOS) made in JS, laid out and modified like any other view
  (`sizing="fit"` uses its own fitting size). `create` runs on main; keep the view from
  `onCreate` to change it later inside `onMain`.
- **Threads.** JS runs on the JS thread; most of UIKit is main-thread-only. `onMain(fn)` runs
  `fn` on main and resumes on the JS thread. Native callbacks fired on main (delegates,
  target-action, UIKit blocks) run on main, so UIKit inside them just works and they can
  return synchronously (e.g. `cellForRowAtIndexPath`). Main gets priority for the VM.
  Calling `@MainActor` API from the JS thread throws `ERR_NATIVESCRIPT_MAIN_THREAD`
  ("UILabel.new() must be called on the main thread … Wrap it in onMain(() => ...)")
  instead of crashing in UIKit; isolation comes from the SDK headers' Swift annotations.
  Background on the design: [`spikes/nativescript/THREADING.md`](spikes/nativescript/THREADING.md).
- **Native callbacks run on main.** Notification observers, completion blocks and
  delegate methods run on the main thread; hop back with `onJS(fn)` (or wrap the callback
  with `toJS(fn)`) before touching React or store state.
- **Namespace.** NativeScript's ~39k globals live in a sibling context; the app sees one
  `native` object.
- **Patched.** It runs on NativeScript built from upstream plus the fixes in
  [`nativescript/patches`](nativescript/patches/README.md) (use-after-free, leaks, quadratic
  lookups, main-thread callbacks, the main-thread guard, dead-context callbacks, and libffi
  rebuilt with unwind info so Objective-C exceptions reach JS), found or built along the way.
- **Measured on an iPhone 15 Pro Max** (no JIT): native property ~1.3 µs, `NSObject.new()`
  ~6.6 µs, `onMain` round trip ~0.03 ms, JS callback on main ~0.007 ms; NativeScript init
  ~190 ms once per process.

## How it works

```
 your .tsx ── scripts/build.mjs ──▶ build/app.js      (your code; React Refresh–instrumented)
 js/*.ts   ── scripts/build.mjs ──▶ runtime.js         (React, reconciler, components; ships in the Swift package)

 JS queue (JavaScriptCore)                        main thread (SwiftUI)
 ─────────────────────────                        ─────────────────────
 React + js/renderer.ts ── one op batch/commit ──▶ NodeTree (@Observable Node per host instance)
                                                       │
 props.onPress() ◀── __dispatch(id, "onPress") ──  NodeView: switch node.type → VStack / Text / Button …
 ref.measure()   ── __native.command(…) ─────────▶ focus / scroll / frame requests on the Node
```

- Each host node is `@Observable`, so SwiftUI only re-evaluates views whose props or
  children React actually changed. Object props are compared by value before sending.
- Babel runs in two passes per file: the React Compiler, then react-refresh over the
  compiler's printed output. (In one pass, refresh can't read hook arguments from the
  compiler's generated nodes, so changing `useState(0)` to `useState(10)` wouldn't remount.)
- On a file change Swift re-runs only `app.js` in the same JS context, then calls
  `performReactRefresh()`. React itself lives in `runtime.js` and is never reloaded.

## Layout

| Path | What |
|---|---|
| `js/renderer.ts` | react-reconciler host config → op stream; events; `HostInstance` (refs) |
| `js/components.ts` | typed JSX components (`VStack`, `Button`, `Sheet`, …) |
| `js/navigation.tsx`, `js/virtual-list.tsx` | `Navigator`/`useNavigation`, `VirtualList` (plain React on top of host components) |
| `js/refresh-setup.ts`, `js/runtime-entry.ts` | React Refresh hook; the runtime bundle's module table |
| `scripts/build.mjs` | esbuild + Babel (React Compiler, then react-refresh); app imports of `react`/`swiftjsx` resolve to the runtime |
| `Sources/SwiftJSX/JSEngine.swift` | JS thread, JSContext, timers/console polyfills, native host |
| `Sources/SwiftJSXNodeAPI/` | Node-API on JavaScriptCore (patched, from napi-ios) + NativeScript loader |
| `js/native.ts`, `js/native-namespace.d.ts` | `native`, `onMain`, `useNativeValue`; generated types |
| `nativescript/` | patches, build-matched type declarations; `scripts/build-nativescript.sh` builds the add-on |
| `Sources/SwiftJSX/JSXRuntime.swift` | public API, hot reload, ref commands |
| `Sources/SwiftJSX/Node.swift` | `Node` / `NodeTree`, applies ops |
| `Sources/SwiftJSX/NodeView.swift`, `Modifiers.swift` | tag → SwiftUI view, modifier props |
| `Sources/SwiftJSX/Gestures.swift`, `RemoteImage.swift`, `Containers.swift` | gestures, transforms, accessibility; URL images; tabs and split views |
| `Sources/SwiftJSX/Controlled.swift` | controlled inputs across threads |
| `Sources/SwiftJSX/Navigation.swift`, `Lists.swift` | stack, screens, presentations; scroll views, virtual list |
| `examples/` | gallery app (one screen per feature) |
| `Tests/Fixtures/*.tsx`, `Tests/SwiftJSXTests/` | test apps and the Swift tests that drive them |
| `Apps/iOS/` | iOS sample app (XcodeGen) and its UI tests |

Adding a component = one `case` in `NodeView.swift` + one line in `components.ts`.

## Gotchas

Things that behave differently from React on the web, or from what you'd guess:

- **React Compiler reads a closure's dependencies eagerly.** `onPress={() => a!.b}` crashes
  while `a` is null, before anyone taps: write `a?.b`.
- **Effects re-run on Fast Refresh** (their cleanups run first), like React Native. Keep
  module-level state in `hot.data`.
- **zustand v5:** a selector that returns a new array or object every time loops; select
  the raw state or use `useShallow`.
- **The React Compiler skips** a component it can't prove safe, and says so in the build
  log and the app's console (the app and examples here have none). Common causes:
  - `useStore.getState()` while rendering. With zustand, read state in render through
    the hook (`const todos = useStore((s) => s.todos)`); `getState()` belongs in event
    handlers, effects and worklet `runOnJS` callbacks.
  - Writing a prop or a hook's return value (`navRef.current = …`,
    `offset.value = …` in a component body): use methods (`offset.set(…)`).
  - `let n = 0` updated (`n++`) inside a closure: use an array or a ref.
  - `?:`, `?.`, `??`, `&&` or `||` inside a `try`/`catch` in a component ("Support value
    blocks … within a try/catch statement"): move the async work (a submit handler's
    `try { await … }`) into a module-level function and call it from the component.
  - A compiler bug: `Math.max(0, list.findIndex((x) => …))` (a method call whose argument
    is a method call with a callback) fails with "MethodCall::property must be an
    unpromoted + unmemoized MemberExpression". Split it into two statements.
- **Buttons in a List row:** several default-style buttons in one row all fire on a tap
  (SwiftUI); give the inner ones a `buttonStyle`.
- **`role="destructive"` swipe actions** remove the row right away (SwiftUI) before any
  confirmation: use `tint="red"` when you ask first.
- **Inside a tinted Button,** `secondary` is relative to the tint; use `secondaryLabel`.
- **`accessibilityIdentifier` on a container** is copied to its children unless it has
  `accessibilityElement="contain"` (UI tests).
- **A ref changes a view's identity** (it adds `.id`): add refs from the start rather than
  later. The same goes for the props that attach gestures, transforms or accessibility.
- **`Text` with an `animation`** rolls its digits (`contentTransition="numericText"`) unless
  you set `contentTransition="identity"`.
- **`Intl` works** (currency, dates, plural rules, `getWeekInfo`). JavaScriptCore has no JIT
  on iOS, so keep heavy work, like date-fns `format()` per row, out of hot loops.
- **Worklets:** the JS thread sees an animating shared value about ten times a second
  (and its last value); read it in a worklet for the current frame.
- **Native backend:** `onMain` calls run in the order they're made; `delegate` properties
  are weak (`keepAlive`).

## Known gaps

See [TODO.md](TODO.md).
