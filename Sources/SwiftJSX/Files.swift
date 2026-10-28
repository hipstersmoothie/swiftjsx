import CoreText
import Foundation

// Fonts loaded at runtime, and AsyncStorage (a key-value store on disk).

// MARK: - Fonts

/// `loadFont(url)`: downloads a .ttf / .otf (or reads a file: URL),
/// registers it for this process, and returns its family and PostScript
/// names (use one as `font={{ name }}`). Fonts don't need Info.plist entries.
enum FontLoader {
    static func load(_ url: URL) async throws -> [String: Any] {
        let file: URL
        if url.isFileURL {
            file = url
        } else {
            let (temporary, response) = try await URLSession.shared.download(from: url)
            if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
                throw URLError(.badServerResponse)
            }
            let folder = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0].appendingPathComponent("SwiftJSXFonts")
            try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            file = folder.appendingPathComponent(url.lastPathComponent.isEmpty ? UUID().uuidString : url.lastPathComponent)
            try? FileManager.default.removeItem(at: file)
            try FileManager.default.moveItem(at: temporary, to: file)
        }
        let descriptors = (CTFontManagerCreateFontDescriptorsFromURL(file as CFURL) as? [CTFontDescriptor]) ?? []
        guard !descriptors.isEmpty else { throw CocoaError(.fileReadCorruptFile) }
        var error: Unmanaged<CFError>?
        if !CTFontManagerRegisterFontsForURL(file as CFURL, .process, &error),
           let failure = error?.takeRetainedValue(),
           CFErrorGetCode(failure) != CTFontManagerError.alreadyRegistered.rawValue {
            throw failure
        }
        let names = descriptors.compactMap { CTFontDescriptorCopyAttribute($0, kCTFontNameAttribute) as? String }
        let family = descriptors.first.flatMap { CTFontDescriptorCopyAttribute($0, kCTFontFamilyNameAttribute) as? String } ?? ""
        return ["family": family, "names": names]
    }
}

// MARK: - AsyncStorage

/// React Native's AsyncStorage API on files: one file per key in
/// Application Support, read and written off the main and JS threads. For
/// data that's too big for localStorage (which lives in memory).
final class KeyValueFiles: @unchecked Sendable {
    static let shared = KeyValueFiles(folder: KeyValueFiles.defaultFolder)

    static var defaultFolder: URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        return base.appendingPathComponent(Bundle.main.bundleIdentifier ?? "SwiftJSX").appendingPathComponent("SwiftJSX/AsyncStorage")
    }

    private let folder: URL
    private let queue = DispatchQueue(label: "SwiftJSX.AsyncStorage")

    init(folder: URL) {
        self.folder = folder
    }

    /// Runs `op` on the storage queue; `done` gets the result.
    func perform(_ op: String, _ args: [String: Any], done: @escaping @Sendable (Any) -> Void) {
        let args = UncheckedSendable(args)
        queue.async { [self] in
            try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
            let keys = (args.value["keys"] as? [String]) ?? (args.value["key"] as? String).map { [$0] } ?? []
            switch op {
            case "get":
                let values: [Any] = keys.map { key in
                    (try? String(contentsOf: file(key), encoding: .utf8)).map { $0 as Any } ?? NSNull()
                }
                done(values)
            case "set":
                let pairs = (args.value["pairs"] as? [[String]]) ?? []
                for pair in pairs where pair.count == 2 {
                    try? Data(pair[1].utf8).write(to: file(pair[0]), options: .atomic)
                }
                done(NSNull())
            case "remove":
                for key in keys { try? FileManager.default.removeItem(at: file(key)) }
                done(NSNull())
            case "keys":
                let names = (try? FileManager.default.contentsOfDirectory(atPath: folder.path)) ?? []
                done(names.compactMap(Self.decode).sorted())
            case "clear":
                try? FileManager.default.removeItem(at: folder)
                done(NSNull())
            default:
                done(NSNull())
            }
        }
    }

    /// Keys as file names: base64url, so any string is a valid name.
    private func file(_ key: String) -> URL {
        let name = Data(key.utf8).base64EncodedString()
            .replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
        return folder.appendingPathComponent(name)
    }

    private static func decode(_ name: String) -> String? {
        var base64 = name.replacingOccurrences(of: "-", with: "+").replacingOccurrences(of: "_", with: "/")
        while base64.count % 4 != 0 { base64 += "=" }
        return Data(base64Encoded: base64).flatMap { String(data: $0, encoding: .utf8) }
    }
}
