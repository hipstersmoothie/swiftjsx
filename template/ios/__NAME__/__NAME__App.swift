import SwiftJSX
import SwiftUI

@main
struct __NAME__App: App {
    /// Debug builds load the app from `npm run dev` on your Mac (Fast Refresh on
    /// save), falling back to the bundled app.js; Release builds run the bundled
    /// production build. Pass `native: .embedded` to turn on the native backend.
    @State private var runtime = JSXRuntime.app()

    var body: some Scene {
        WindowGroup {
            ReactView(runtime: runtime)
        }
    }
}
