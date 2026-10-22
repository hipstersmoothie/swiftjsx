# SwiftJSX iOS demo

A minimal iOS 18+ app that mounts the React bundle (`build/app.js`) with
`ReactView`. The Xcode project is generated from `project.yml` by
[XcodeGen](https://github.com/yonaskolb/XcodeGen) and isn't committed.

## Generate & open

```sh
npm install && npm run build          # at the repo root: produces build/app.js
cd Apps/iOS
xcodegen generate                     # writes SwiftJSXDemo.xcodeproj
open SwiftJSXDemo.xcodeproj           # run the "SwiftJSXDemo" scheme on a simulator
```

## Build & run from the command line

```sh
cd Apps/iOS
xcodebuild -project SwiftJSXDemo.xcodeproj -scheme SwiftJSXDemo \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  -derivedDataPath build build
xcrun simctl boot 'iPhone 17 Pro'; open -a Simulator
xcrun simctl install booted build/Build/Products/Debug-iphonesimulator/SwiftJSXDemo.app
xcrun simctl launch --console-pty booted dev.swiftjsx.demo   # shows [js:...] logs
```

Simulator builds aren't code signed. To run on a device, set your
`DEVELOPMENT_TEAM` in Xcode (or in `project.yml`).

## Hot reload (simulator)

A **Debug simulator** build doesn't use the copy of `app.js` inside the app.
Instead it reads `build/app.js` straight from the repo on your Mac (the
simulator can read host paths) with `hotReload: true`:

```sh
npm run dev      # esbuild --watch at the repo root
```

Save a file under `examples/` and the running app updates in place, keeping
state. The absolute path comes from the `SWIFTJSX_DEV_BUNDLE` build setting
(`$(SRCROOT)/../../build/app.js`, Debug + simulator only). It's written into
Info.plist as `SwiftJSXDevBundlePath`. Nothing is hardcoded in source.

Device and Release builds load the `app.js` that the **Copy app.js bundle**
pre-build phase copies into the app: `build/app.js` for Debug, and
`build/app.production.js` (React's production build, minified) for Release. That phase
fails with a clear error if the bundle doesn't exist. `npm run dev` only rebuilds the
development bundle, so run `npm run build` before a Release build: the app ships
whatever the bundle contained at build time.

## UI tests

`SwiftJSXDemoUITests` drives the gallery in the simulator with XCUITest: typing into a
field that rejects edits, tabs, gestures (double tap, long press, drag), the split view,
and remote images (needs network):

```sh
xcodebuild test -project SwiftJSXDemo.xcodeproj -scheme SwiftJSXDemo \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' -derivedDataPath build
```

The tests find views by `accessibilityIdentifier` / `accessibilityLabel` props set in
`examples/`.

## Native backend (optional)

If `build/nativescript/NativeScript.xcframework` exists (run `scripts/build-nativescript.sh`
at the repo root once), the "Embed NativeScript add-on" build phase copies the right slice
into the app and signs it, and the app creates its runtime with `native: .embedded`, so the
gallery's **Native** screen works. Without it the app still builds and runs; `native` is
just unavailable.

## On a device

Signing is automatic; pass your team on the command line, e.g.

```sh
xcodebuild -project SwiftJSXDemo.xcodeproj -scheme SwiftJSXDemo -configuration Release \
  -destination 'generic/platform=iOS' -derivedDataPath build DEVELOPMENT_TEAM=<TEAMID> build
xcrun devicectl device install app --device <udid> build/Build/Products/Release-iphoneos/SwiftJSXDemo.app
```

Release builds embed the production bundle (no hot reload); run `npm run build` first.

## Scroll benchmark

`ScrollBenchmark.swift` scrolls the tallest scroll view on screen at constant speeds
with a display link and prints frame pacing, hitches (with timestamps and React commit
counts), blank virtual-list rows, and commit counts. Point `build/app.js` at the screen
to measure (e.g. `node scripts/build.mjs bench.tsx` with an entry rendering
`<VirtualListDemo />`; it writes both bundles), build Release, and launch with
`SWIFTJSX_SCROLL_BENCH=1`, or `=here` to start from where the screen put you (e.g. after a
`scrollTo`) instead of the top:

```sh
DEVICECTL_CHILD_SWIFTJSX_SCROLL_BENCH=1 xcrun devicectl device process launch --console \
  --terminate-existing --device <udid> dev.swiftjsx.demo | grep BENCH
```

The app opts into 120 Hz on ProMotion iPhones (`CADisableMinimumFrameDurationOnPhone`).
