import SwiftJSX
import SwiftUI

@main
struct SwiftJSXDemoApp: App {
    /// Debug: the simulator reads `build/app.js` straight from the repo (path
    /// baked into Info.plist) and devices load from `npm run dev`'s server,
    /// both with Fast Refresh; otherwise the bundled app.js. `native` is on if
    /// the NativeScript add-on is embedded.
    @State private var runtime = JSXRuntime.app(native: .embedded)

    var body: some Scene {
        WindowGroup {
            // The JS app supplies its own NavigationStack / ScrollView.
            ReactView(runtime: runtime)
                .onAppear { ScrollBenchmark.startIfRequested() }
        }
    }
}
