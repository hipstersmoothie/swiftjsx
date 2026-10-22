import SwiftJSX
import SwiftUI

@main
struct SwiftJSXDemoApp: App {
    @State private var runtime: JSXRuntime = {
        let (url, hotReload) = SwiftJSXDemoApp.bundleLocation()
        print("[demo] loading \(url.path) (hotReload: \(hotReload))")
        // `native` backend: on if the NativeScript add-on is embedded in the app.
        return JSXRuntime(bundleURL: url, hotReload: hotReload, native: .embedded)
    }()

    /// Debug simulator builds read `build/app.js` straight from the repo on the
    /// host (path baked into Info.plist at build time) and hot-reload it, so
    /// `npm run dev` + save updates the running app. Everything else uses the
    /// `app.js` copied into the app bundle by the "Copy app.js bundle" phase.
    static func bundleLocation() -> (URL, hotReload: Bool) {
        #if DEBUG && targetEnvironment(simulator)
        if let path = Bundle.main.object(forInfoDictionaryKey: "SwiftJSXDevBundlePath") as? String,
           !path.isEmpty {
            let url = URL(fileURLWithPath: path).standardizedFileURL
            if FileManager.default.fileExists(atPath: url.path) {
                return (url, true)
            }
            print("[demo] dev bundle missing at \(url.path); falling back to the embedded app.js")
        }
        #endif
        guard let url = Bundle.main.url(forResource: "app", withExtension: "js") else {
            fatalError("app.js is missing from the app bundle (the 'Copy app.js bundle' build phase should add it)")
        }
        return (url, false)
    }

    var body: some Scene {
        WindowGroup {
            // The JS app supplies its own NavigationStack / ScrollView.
            ReactView(runtime: runtime)
                .onAppear { ScrollBenchmark.startIfRequested() }
        }
    }
}
