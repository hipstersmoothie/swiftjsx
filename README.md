# SwiftJSX (experimental)

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

## Run it

```sh
npm install
npm run dev          # watches; writes build/app.js (+ the runtime and test fixtures)
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
- **React Compiler.** All your components and hooks (and the library's) are auto-memoized
  at build time — no `memo`, `useMemo` or `useCallback` needed. The build prints
  `React Compiler → build/app.js: 10 memoized, 0 skipped`, plus the file, line and reason
  for anything it had to leave unmemoized (rule-of-React violations, unsupported syntax).
- **Fast Refresh.** Save a file: changed components are swapped in place and keep their
  state. Changing a component's hooks remounts just that component. Syntax/runtime errors
  show a red box and clear on the next good save.
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
  benchmark). `listStyle="list"` uses SwiftUI's `List` for the list look, but `List`
  finds each cell by walking rows from the start, so it gets slow far down long lists.
- **Refs.** `ref.current.focus()`, `.blur()`, `.scrollTo(ref | index | "top" | "end")`,
  `await .measure()`. `useImperativeHandle` etc. work as usual on top.
- **Modifiers are props**, applied CSS-box-model style:
  `padding → frame → background → cornerRadius → border → shadow → opacity → offset/scale/rotation`.
  `animation="spring"` animates a node's changes; children can set `transition`. Setting or
  clearing a prop never resets a view's state: a text field keeps focus, a scroll view
  its position.
- **Gestures.** `onTapGesture`, `onDoubleTap`, `onLongPress`, `onDrag`/`onDragEnd`
  (translation, location, velocity, predicted end), `onMagnify`, `onRotate`. Handlers run
  on the JS thread like any event. Pair them with `offset`/`scale`/`rotation` state, and
  `animation={dragging ? undefined : "spring"}` to follow the finger and spring back.
- **Images.** `<Image systemName>` (SF Symbols), `<Image name>` (asset catalog), and
  `<Image src="https://…" contentMode="fill">`. URL images are cached in memory, requested
  once even when several views want them, and decoded off the main thread. They fire
  `onLoad`/`onError`.
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

- **Threads.** JS runs on the JS thread; most of UIKit is main-thread-only. `onMain(fn)` runs
  `fn` on main and resumes on the JS thread. Native callbacks fired on main (delegates,
  target-action, UIKit blocks) run on main, so UIKit inside them just works and they can
  return synchronously (e.g. `cellForRowAtIndexPath`). Main gets priority for the VM.
  Calling `@MainActor` API from the JS thread throws `ERR_NATIVESCRIPT_MAIN_THREAD`
  ("UILabel.new() must be called on the main thread … Wrap it in onMain(() => ...)")
  instead of crashing in UIKit; isolation comes from the SDK headers' Swift annotations.
  Background on the design: [`spikes/nativescript/THREADING.md`](spikes/nativescript/THREADING.md).
- **Namespace.** NativeScript's ~39k globals live in a sibling context; the app sees one
  `native` object.
- **Patched.** It runs on NativeScript built from upstream plus the fixes in
  [`nativescript/patches`](nativescript/patches/README.md) (use-after-free, leaks, quadratic
  lookups, main-thread callbacks, the main-thread guard), found or built along the way.
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

## Known gaps

- The compiler uses Babel 7 (`babel-plugin-react-compiler` 1.0 is built against Babel 7's
  AST; under Babel 8 it rejects some valid code, e.g. destructuring defaults).
- `foregroundStyle`, gestures, transforms, accessibility props and refs are attached the
  first time a view uses them and then stay (always-on, idle gestures doubled scroll hitches
  in long lists). So the *first* time one of them appears on a view that's already mounted,
  that view's SwiftUI state resets once. Props present from mount (the usual case) never
  reset it.
- Gesture updates go to React and back: a drag tracks the finger with about a frame of
  latency. There's no native-driven animation (like Reanimated worklets) yet.
- No `Canvas`, maps, video, or custom fonts yet.
- Native backend: NativeScript's runtime is an alpha; its metadata generator (LLVM 17)
  misses some declarations in current SDKs (e.g. `NSProcessInfo.lowPowerModeEnabled` on
  macOS). Long synchronous JS still delays main-thread native callbacks: keep work sliced.
  The JS thread must never block on main.
