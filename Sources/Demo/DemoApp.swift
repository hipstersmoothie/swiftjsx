import AppKit
import SwiftJSX
import SwiftUI

@main
struct DemoApp: App {
    @State private var runtime = JSXRuntime(bundleURL: DemoApp.bundleURL, hotReload: true, native: DemoApp.native)

    /// The macOS NativeScript add-on from scripts/build-nativescript.sh, if built.
    static var native: NativeOptions? {
        let url = bundleURL.deletingLastPathComponent()
            .appendingPathComponent("nativescript/macos/macos-arm64/NativeScript.framework/Versions/A/NativeScript")
        return FileManager.default.fileExists(atPath: url.path) ? NativeOptions(addonURL: url) : nil
    }

    /// `SWIFTJSX_BUNDLE` if set, otherwise `build/app.js` at the repo root
    /// (what `npm run build` / `npm run dev` produce).
    static var bundleURL: URL {
        if let path = ProcessInfo.processInfo.environment["SWIFTJSX_BUNDLE"] {
            return URL(fileURLWithPath: path)
        }
        return URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
            .appendingPathComponent("build/app.js")
    }

    init() {
        // Launched via `swift run`, so promote ourselves to a regular foreground app.
        NSApplication.shared.setActivationPolicy(.regular)
        NSApplication.shared.activate()
        if let path = ProcessInfo.processInfo.environment["SWIFTJSX_SNAPSHOT"] {
            DemoApp.snapshot(to: URL(fileURLWithPath: path))
        }
    }

    /// Debug hook: write a PNG of our own window after launch (no Screen
    /// Recording permission needed, since it's our own view hierarchy).
    static func snapshot(to url: URL) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            guard let view = NSApplication.shared.windows.first?.contentView,
                  let rep = view.bitmapImageRepForCachingDisplay(in: view.bounds) else { return }
            view.cacheDisplay(in: view.bounds, to: rep)
            try? rep.representation(using: .png, properties: [:])?.write(to: url)
            print("[demo] wrote \(url.path)")
        }
    }

    var body: some Scene {
        WindowGroup("SwiftJSX") {
            ReactView(runtime: runtime)
                .frame(minWidth: 440, minHeight: 640)
        }
    }
}
