// swift-tools-version: 6.0
// SPIKE: can NativeScript's Node-API runtime share SwiftJSX's JavaScriptCore
// context and give JS direct access to native APIs? Not part of the library.
import PackageDescription

let package = Package(
    name: "NativeScriptSpike",
    platforms: [.macOS(.v14), .iOS(.v17)],
    products: [.library(name: "NodeAPIJSC", targets: ["NodeAPIJSC"])],
    targets: [
        // Node-API implemented on JavaScriptCore (vendored from NativeScript/napi-ios),
        // plus a minimal threadsafe-function shim and a loader.
        .target(
            name: "NodeAPIJSC",
            cxxSettings: [.unsafeFlags(["-fblocks"])],
            linkerSettings: [.linkedFramework("JavaScriptCore")]
        ),
        .executableTarget(
            name: "Spike",
            dependencies: ["NodeAPIJSC"],
            // The NativeScript add-on resolves napi_* against the host process.
            linkerSettings: [.unsafeFlags(["-Xlinker", "-export_dynamic"])]
        ),
    ],
    swiftLanguageModes: [.v5],
    cxxLanguageStandard: .cxx20
)
