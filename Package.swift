// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "SwiftJSX",
    platforms: [.macOS(.v14), .iOS(.v17)],
    products: [
        .library(name: "SwiftJSX", targets: ["SwiftJSX"]),
    ],
    targets: [
        .target(name: "SwiftJSX", dependencies: ["SwiftJSXNodeAPI"], resources: [.copy("Resources/runtime.js")]),
        // Node-API on JavaScriptCore (from NativeScript/napi-ios, patched) and the
        // glue that loads NativeScript for the optional `native` backend.
        .target(name: "SwiftJSXNodeAPI", linkerSettings: [.linkedFramework("JavaScriptCore")]),
        .executableTarget(name: "Demo", dependencies: ["SwiftJSX"]),
        .testTarget(name: "SwiftJSXTests", dependencies: ["SwiftJSX"]),
    ],
    cxxLanguageStandard: .cxx20
)
