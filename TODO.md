# TODO

Known gaps and ideas, roughly by area. Nothing here is scheduled.

## Components

- [ ] `TextEditor` (multi-line text), `DatePicker`, `ColorPicker`.
- [ ] `Menu` and `.contextMenu` (long-press menus).
- [ ] List features: swipe actions, `.refreshable` (pull to refresh), `.searchable`,
      edit mode (delete / move rows).
- [ ] `Canvas`, maps (MapKit), video (AVKit), web views.
- [ ] Custom fonts (`font` only takes the system text styles today).
- [ ] Keyboard toolbar and keyboard avoidance controls.

## Gestures and animation

- [x] Worklets: gesture handlers and animated styles on the main thread
      (`useSharedValue`, `useAnimatedStyle`, `withSpring`, `withTiming`, `runOnJS`).
- [x] `withAnimation` from JS, and SwiftUI animation specs for the `animation` prop.
- [ ] Worklet animations are SwiftUI animations: a worklet can't read a value
      mid-animation, and there's no `withDecay`, `withRepeat` or `withSequence`.
- [ ] No `useDerivedValue` / `useAnimatedReaction`; worklets can only drive props
      through `useAnimatedStyle`, and only gesture handlers can be worklets.
- [ ] Spring animations started from a gesture don't take the finger's velocity.

## Rendering

- [ ] `foregroundStyle`, gestures, transforms, accessibility props and refs are attached
      the first time a view uses them and then stay (always-on, idle gestures doubled
      scroll hitches in long lists). So the *first* time one of them appears on a view
      that's already mounted, that view's SwiftUI state resets once (a text field inside
      it loses focus). Props present from mount never reset it. `foregroundStyle` has no
      no-op form: `.foregroundStyle(.foreground)` and the three-level
      `.foregroundStyle(.primary, .secondary, .tertiary)` both turn a List's gray
      headers black.
- [x] `VirtualList listStyle="list"` is a UICollectionView list on iOS, fast at any depth.
- [ ] Over that UIKit list, a large navigation title doesn't collapse into the inline
      title (SwiftUI only tracks its own scroll views); use `titleDisplayMode="inline"`.
      Off iOS, `listStyle="list"` is still SwiftUI's `List`.
- [x] `VirtualList.scrollTo(index)` jumps by offset: `ScrollViewProxy.scrollTo` searched
      rows from the top and froze the app ~10 s for row 50,000.
- [ ] Without `itemHeight`, `scrollTo(index)` lands on an estimate
      (`estimatedItemHeight`) when rows vary in height.

## Build and tooling

- [ ] The React Compiler runs on Babel 7: `babel-plugin-react-compiler` 1.0 is built
      against Babel 7's AST, and under Babel 8 it rejects some valid code (e.g.
      destructuring defaults).
- [ ] React DevTools support.
- [ ] CI: `swift test` on macOS, plus the XCUITest suite in `Apps/iOS` on a simulator.
- [ ] `xcodebuild test` hangs after the UI tests finish (an Xcode quirk while writing
      the results); it has to be stopped by hand once it prints "Executed 5 tests".
- [ ] Hot reload only works in the simulator (it reads `build/app.js` from the host).
      Serve the bundle over the network for devices.

## Native backend (NativeScript)

- [ ] NativeScript's Node-API runtime is an alpha.
- [ ] Its metadata generator (LLVM 17) misses some declarations in current SDKs, e.g.
      `NSProcessInfo.lowPowerModeEnabled` on macOS.
- [ ] Long synchronous JS still delays main-thread native callbacks; keep work sliced.
      The JS thread must never block on main.
- [ ] The six patches in `nativescript/patches/` haven't been sent upstream.

## Project

- [ ] Add a license. The vendored NativeScript code is MIT and keeps its own license files.
