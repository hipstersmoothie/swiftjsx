import Foundation
import Observation
import SwiftUI

/// Runs a React app (an app bundle built by `scripts/build.mjs`) and keeps a
/// `NodeTree` in sync with what it renders. Mount it with `ReactView`.
@MainActor @Observable
public final class JSXRuntime {
    public let tree = NodeTree()
    /// Last uncaught JS error, shown as a red-box overlay by `ReactView`.
    public private(set) var error: String?

    @ObservationIgnored private var engine: JSEngine!
    @ObservationIgnored private(set) var worklets: WorkletRuntime!
    @ObservationIgnored private var appEvents: AppEvents?
    @ObservationIgnored private var waiting: [Int: CheckedContinuation<Void, Never>] = [:]
    @ObservationIgnored private var nextWait = 1
    /// The SwiftUI environment JS sees through useEnvironment() (sent again after reloads).
    @ObservationIgnored private var environment: [String: String] = [:]
    @ObservationIgnored private var bundleURL: URL?
    @ObservationIgnored private var watcher: Timer?
    @ObservationIgnored private var lastModified: Date?
    @ObservationIgnored private var loadStarted: ContinuousClock.Instant?

    /// - Parameter native: enable the `native` backend (direct Objective-C / C
    ///   access from JS via NativeScript). `nil` (the default) leaves it off.
    public init(threading: JSThreading = .background, native: NativeOptions? = nil) {
        engine = JSEngine(threading: threading, native: native, callbacks: EngineCallbacks(
            commit: { [weak self] ops, animation in
                guard let self else { return }
                if let animation = parseAnimation(animation) {
                    SwiftJSXDiagnostics.animatedCommits += 1
                    withAnimation(animation) { tree.apply(ops) }
                } else {
                    tree.apply(ops)
                }
                if let started = loadStarted {
                    loadStarted = nil
                    print(String(format: "[swiftjsx] first render %.0f ms after load (%@ runtime)",
                                 started.duration(to: .now) / .milliseconds(1), isProduction ? "production" : "development"))
                }
            },
            command: { [weak self] id, name, args, callback in self?.handleCommand(id, name, args, callback) },
            fatal: { [weak self] message in self?.report(message) }
        ))
        worklets = WorkletRuntime(
            tree: tree,
            callJS: { [weak self] id, args in self?.engine.call("__swiftjsx_callJS", [id, args]) },
            syncToJS: { [weak self] values in self?.engine.call("__swiftjsx_sharedValues", [values]) },
            report: { [weak self] message in self?.report(message) }
        )
        tree.worklets = worklets
        let engine = engine!
        appEvents = AppEvents { type in engine.call("__swiftjsx_windowEvent", [type]) }
    }

    /// Load an app bundle from disk. With `hotReload`, the file is watched and
    /// changes are applied with React Refresh (pair with `npm run dev`).
    public convenience init(bundleURL: URL, hotReload: Bool = false, threading: JSThreading = .background,
                            native: NativeOptions? = nil) {
        self.init(threading: threading, native: native)
        self.bundleURL = bundleURL
        reload()
        if hotReload { watch() }
    }

    isolated deinit {
        watcher?.invalidate()
        engine.stop()
    }

    /// Mount an app bundle from scratch (fresh JS context, empty tree).
    ///
    /// Production bundles (`build/app.production.js`) run on React's production
    /// build; others on the development build, which Fast Refresh needs.
    public func load(app: String, sourceURL: URL? = nil) {
        tree.reset()
        error = nil
        isProduction = app.hasPrefix(Self.productionBanner)
        loadStarted = .now
        let name = isProduction ? "runtime.production" : "runtime"
        guard let runtime = Self.runtimeScript(name) else {
            return report("SwiftJSX: \(name).js is missing from the package resources. Run `npm run build`.")
        }
        engine.start(runtime: runtime, app: app, appURL: sourceURL)
        if !environment.isEmpty { engine.call("__swiftjsx_environment", [environment]) }
    }

    func setEnvironment(_ values: [String: String]) {
        guard values != environment else { return }
        environment = values
        engine.call("__swiftjsx_environment", [values])
    }

    /// Whether the loaded bundle is a production build.
    public private(set) var isProduction = false

    /// Full reload from disk: state is lost. (Saving a file hot-updates instead.)
    public func reload() {
        guard let url = bundleURL else { return }
        lastModified = modificationDate(url)
        do {
            load(app: try String(contentsOf: url, encoding: .utf8), sourceURL: url)
        } catch {
            report("Couldn't read \(url.path): \(error.localizedDescription)\nRun `npm run build` first.")
        }
    }

    /// Deliver a native event (button press, text change…) to the React
    /// handler prop named `event` on node `id`.
    public func dispatch(_ id: Int, _ event: String, _ payload: Any? = nil, seq: Int? = nil) {
        engine.dispatch(id, event, payload, seq: seq)
    }

    /// Delivers an event and waits until the handler (and the promise it
    /// returns, if any) is done. For `onRefresh`.
    func dispatchAndWait(_ id: Int, _ event: String, _ payload: Any? = nil) async {
        await withCheckedContinuation { continuation in
            let callback = nextWait
            nextWait += 1
            waiting[callback] = continuation
            engine.dispatch(id, event, payload, seq: nil, callback: callback)
        }
    }

    /// Delivers a gesture event: a worklet handler runs right here on the main
    /// thread; a regular one is dispatched to React on the JS thread.
    func fire(_ node: Node, _ event: String, _ payload: Any? = nil) {
        if WorkletRuntime.isWorklet(node.props[event]) {
            worklets.run(node, event, payload)
        } else {
            dispatch(node.id, event, payload)
        }
    }

    // MARK: Refs

    private func handleCommand(_ id: Int, _ name: String, _ args: [String: Any], _ callback: Int) {
        guard let node = tree.node(id) else { return }
        switch name {
        case "worklet":
            worklets.handle(args)
        case "eventDone":
            if let callback = (args["callback"] as? NSNumber)?.intValue { waiting.removeValue(forKey: callback)?.resume() }
        case "haptic":
            playHaptic(args["kind"] as? String)
            engine.resolve(callback: callback, value: NSNull())
        case "clipboardWrite":
            writeClipboard(args["text"] as? String ?? "")
            engine.resolve(callback: callback, value: NSNull())
        case "clipboardRead":
            engine.resolve(callback: callback, value: readClipboard())
        case "openURL":
            guard let url = (args["url"] as? String).flatMap(URL.init(string:)) else {
                return engine.resolve(callback: callback, value: false)
            }
            openExternal(url, inApp: args["inApp"] as? Bool ?? false) { [engine] opened in
                engine?.resolve(callback: callback, value: opened)
            }
        case "canOpenURL":
            engine.resolve(callback: callback, value: (args["url"] as? String).flatMap(URL.init(string:)).map(canOpenExternal) ?? false)
        case "focus", "blur":
            node.focusRequest = FocusRequest(seq: node.focusRequest.seq + 1, focused: name == "focus")
        case "scrollTo":
            let target: AnyHashable =
                (args["node"] as? NSNumber).map { AnyHashable($0.intValue) }
                ?? (args["index"] as? NSNumber).map { AnyHashable($0.intValue) }
                ?? AnyHashable(args["edge"] as? String == "end" ? ScrollEdge.end : ScrollEdge.top)
            node.scrollRequest = ScrollRequest(
                seq: (node.scrollRequest?.seq ?? 0) + 1,
                target: target,
                anchor: unitPoint(args["anchor"] as? String),
                animated: args["animated"] as? Bool ?? true
            )
        case "measure":
            node.measure { [engine] f in
                engine?.resolve(callback: callback, value: ["x": f.minX, "y": f.minY, "width": f.width, "height": f.height])
            }
        default:
            print("[swiftjsx] unknown command \(name)")
        }
    }

    private func report(_ message: String) {
        print("[js:uncaught] \(message)")
        error = message
    }

    // MARK: Hot reload

    private func watch() {
        watcher = Timer.scheduledTimer(withTimeInterval: 0.25, repeats: true) { [weak self] _ in
            MainActor.assumeIsolated { self?.checkForUpdate() }
        }
    }

    private func checkForUpdate() {
        guard let url = bundleURL, let date = modificationDate(url), date != lastModified else { return }
        lastModified = date
        guard let app = try? String(contentsOf: url, encoding: .utf8), !app.isEmpty else { return }
        print("[swiftjsx] hot update")
        hotUpdate(app: app, sourceURL: url)
    }

    /// Evaluates a script in the app's context and returns its string value (tests only).
    func evaluateForTests(_ script: String) -> String? {
        engine.evaluateForTests(script)
    }

    /// Re-run an app bundle in the live context; React Refresh keeps state.
    func hotUpdate(app: String, sourceURL: URL? = nil) {
        // React Refresh only exists in the development runtime; reload instead.
        if isProduction || app.hasPrefix(Self.productionBanner) {
            return load(app: app, sourceURL: sourceURL)
        }
        error = nil
        engine.hotUpdate(app: app, appURL: sourceURL)
    }

    private func modificationDate(_ url: URL) -> Date? {
        (try? FileManager.default.attributesOfItem(atPath: url.path))?[.modificationDate] as? Date
    }

    /// First line of production app bundles (keep in sync with scripts/build.mjs).
    static let productionBanner = "/* swiftjsx:production */"

    static func runtimeScript(_ name: String) -> String? {
        if let cached = runtimeScripts[name] { return cached }
        let script = Bundle.module.url(forResource: name, withExtension: "js")
            .flatMap { try? String(contentsOf: $0, encoding: .utf8) }
        runtimeScripts[name] = script
        return script
    }
    private static var runtimeScripts: [String: String] = [:]
}
