# __NAME__

A [SwiftJSX](https://github.com/hipstersmoothie/swiftjsx) app: React and JSX, rendered as SwiftUI.

```sh
npm install
npm run dev                  # serves the app on port 8081; keep it running
open ios/__NAME__.xcodeproj  # run in the simulator, or on a device on the same Wi-Fi
```

Edit `src/App.tsx` and save: the running app updates in place (Fast Refresh).
`ios/project.yml` is an [XcodeGen](https://github.com/yonaskolb/XcodeGen) spec; run
`xcodegen` in `ios/` after changing it. Release builds bundle the production build
of the app (`npm run build`).

## Permissions, Info.plist keys and capabilities

The app is yours: add what it needs to `ios/project.yml`, then run `xcodegen`.

- **Usage descriptions** (iOS asks with this text): under `settings: base:`, e.g.
  `INFOPLIST_KEY_NSLocationWhenInUseUsageDescription: Shows where you are on the map.`
  (for `navigator.geolocation` and `<MapView showsUserLocation>`), `NSCameraUsageDescription`,
  `NSMicrophoneUsageDescription`, `NSPhotoLibraryUsageDescription`.
- **Other keys** without an `INFOPLIST_KEY_` setting go in `ios/__NAME__/Info.plist`,
  e.g. background audio:

  ```xml
  <key>UIBackgroundModes</key>
  <array><string>audio</string></array>
  ```

- **Capabilities** (push notifications, App Groups, time-sensitive notifications) need
  an entitlements file: add `entitlements: { path: __NAME__/__NAME__.entitlements,
  properties: { ... } }` to the target, and enable them for your App ID in your Apple
  developer account.
