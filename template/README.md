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
