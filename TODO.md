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

- [ ] Gesture updates go to React and back, so a drag trails the finger by about a
      frame. Add native-driven animations (like Reanimated worklets) for gestures that
      need to track the finger exactly.
- [ ] Animation is per node (`animation="spring"`) or per transition. There's no
      `withAnimation`-style API to animate one specific state change from JS.

## Rendering

- [ ] `foregroundStyle`, gestures, transforms, accessibility props and refs are attached
      the first time a view uses them and then stay (always-on, idle gestures doubled
      scroll hitches in long lists). So the *first* time one of them appears on a view
      that's already mounted, that view's SwiftUI state resets once. Props present from
      mount never reset it. A cheaper always-on form would close this.
- [ ] `VirtualList listStyle="list"` (SwiftUI `List`) gets slow far down long lists:
      `List` finds each cell by walking rows from the start. The default stack style is
      fine at any depth.

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
