import Foundation

// Development builds load the app from `swiftjsx dev` on the Mac over the
// network (simulator and devices), with Fast Refresh on every save.
//
// Protocol: GET <server>/app.js?after=<version>&session=<id> answers with the
// bundle as soon as there's a build newer than `version` (200, with
// X-SwiftJSX-Version / X-SwiftJSX-Session headers), or 204 after a while with
// nothing new (long polling). A failed build answers 500 with the error text.

extension JSXRuntime {
    /// Loads and hot-reloads the app from a dev server (`swiftjsx dev`). Tries
    /// each URL in order until one answers; if none does at launch, runs
    /// `fallbackBundleURL` (the bundled app.js) and keeps trying.
    public convenience init(devServers: [URL], fallbackBundleURL: URL? = nil, threading: JSThreading = .background,
                            native: NativeOptions? = nil) {
        self.init(threading: threading, native: native)
        startDevServerClient(devServers, fallback: fallbackBundleURL)
    }

    /// The runtime an app wants, from its Info.plist and bundle:
    /// - `SwiftJSXDevServer` (Debug builds; written by the build): the dev
    ///   server(s), comma-separated, falling back to the bundled app.js.
    /// - `SwiftJSXDevBundlePath` (Debug simulator builds of this repo's demo):
    ///   a bundle on the Mac's disk, watched for changes.
    /// - Otherwise the bundled app.js (Release: the production build).
    public static func app(native: NativeOptions? = nil, threading: JSThreading = .background) -> JSXRuntime {
        let bundled = Bundle.main.url(forResource: "app", withExtension: "js")
        let info = Bundle.main.infoDictionary ?? [:]
        #if targetEnvironment(simulator)
        if let path = info["SwiftJSXDevBundlePath"] as? String, !path.isEmpty,
           FileManager.default.fileExists(atPath: path) {
            print("[swiftjsx] loading \(path) (hot reload)")
            return JSXRuntime(bundleURL: URL(fileURLWithPath: path), hotReload: true, threading: threading, native: native)
        }
        #endif
        let servers = devServerURLs(info)
        if !servers.isEmpty {
            return JSXRuntime(devServers: servers, fallbackBundleURL: bundled, threading: threading, native: native)
        }
        guard let bundled else {
            fatalError("app.js is missing from the app bundle: run `swiftjsx build` (the Xcode build phase copies it)")
        }
        return JSXRuntime(bundleURL: bundled, threading: threading, native: native)
    }

    /// `SwiftJSXDevServer` from Info.plist, or the SwiftJSXDevServer.txt the
    /// build writes into the app (one URL per line; empty in Release).
    static func devServerURLs(_ info: [String: Any]) -> [URL] {
        var text = info["SwiftJSXDevServer"] as? String ?? ""
        if text.isEmpty, let file = Bundle.main.url(forResource: "SwiftJSXDevServer", withExtension: "txt") {
            text = (try? String(contentsOf: file, encoding: .utf8)) ?? ""
        }
        return text.split(whereSeparator: { $0 == "," || $0.isNewline })
            .map { $0.trimmingCharacters(in: .whitespaces) }
            .filter { !$0.isEmpty }
            .compactMap(URL.init(string:))
    }
}

/// Talks to the dev server for one runtime; cancelled with it.
@MainActor
final class DevServerClient {
    private weak var runtime: JSXRuntime?
    private let servers: [URL]
    private let fallback: URL?
    private var task: Task<Void, Never>?
    private let session = URLSession(configuration: {
        let config = URLSessionConfiguration.ephemeral
        config.timeoutIntervalForRequest = 90
        config.waitsForConnectivity = false
        return config
    }())

    init(runtime: JSXRuntime, servers: [URL], fallback: URL?) {
        self.runtime = runtime
        self.servers = servers
        self.fallback = fallback
        task = Task { [weak self] in await self?.run() }
    }

    func stop() {
        task?.cancel()
        session.invalidateAndCancel()
    }

    private func run() async {
        var server: URL?
        var version = 0
        var serverSession = ""
        var loadedFromServer = false
        var usedFallback = false

        while !Task.isCancelled {
            // Find a server that answers (quick timeouts while searching).
            if server == nil {
                for candidate in servers {
                    if await probe(candidate) { server = candidate; break }
                }
                guard let found = server else {
                    if !usedFallback, !loadedFromServer, let fallback, let app = try? String(contentsOf: fallback, encoding: .utf8) {
                        usedFallback = true
                        print("[swiftjsx] no dev server at \(servers.map(\.absoluteString).joined(separator: ", ")); running the bundled app.js")
                        runtime?.load(app: app, sourceURL: fallback)
                    }
                    try? await Task.sleep(for: .seconds(2))
                    continue
                }
                print("[swiftjsx] connected to dev server \(found.absoluteString)")
            }

            var components = URLComponents(url: server!.appendingPathComponent("app.js"), resolvingAgainstBaseURL: false)!
            components.queryItems = [URLQueryItem(name: "after", value: String(version)), URLQueryItem(name: "session", value: serverSession)]
            do {
                let (data, response) = try await session.data(from: components.url!)
                guard let http = response as? HTTPURLResponse, let runtime else { return }
                if let newSession = http.value(forHTTPHeaderField: "X-SwiftJSX-Session") { serverSession = newSession }
                if let newVersion = http.value(forHTTPHeaderField: "X-SwiftJSX-Version").flatMap(Int.init) { version = newVersion }
                switch http.statusCode {
                case 200:
                    let app = String(decoding: data, as: UTF8.self)
                    if loadedFromServer {
                        print("[swiftjsx] hot update")
                        runtime.hotUpdate(app: app, sourceURL: components.url)
                    } else {
                        // The fallback ran other code: start fresh.
                        loadedFromServer = true
                        runtime.load(app: app, sourceURL: components.url)
                    }
                case 500:
                    runtime.showBuildError(String(decoding: data, as: UTF8.self))
                default:
                    break // 204: nothing new yet
                }
            } catch {
                if Task.isCancelled { return }
                // The server went away (stopped, Mac asleep): look again.
                print("[swiftjsx] lost the dev server (\(error.localizedDescription)); retrying")
                server = nil
                try? await Task.sleep(for: .seconds(1))
            }
        }
    }

    private func probe(_ url: URL) async -> Bool {
        var request = URLRequest(url: url.appendingPathComponent("status"))
        request.timeoutInterval = 2
        guard let (_, response) = try? await session.data(for: request) else { return false }
        return (response as? HTTPURLResponse)?.statusCode == 200
    }
}
