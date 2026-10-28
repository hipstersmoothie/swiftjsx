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
            commit: { [weak self] ops, animation, completion in
                guard let self else { return }
                if let animation = parseAnimation(animation) {
                    SwiftJSXDiagnostics.animatedCommits += 1
                    if completion > 0 {
                        withAnimation(animation, completionCriteria: .logicallyComplete) { tree.apply(ops) } completion: { [weak self] in
                            self?.engine.resolve(callback: completion, value: NSNull())
                        }
                    } else {
                        withAnimation(animation) { tree.apply(ops) }
                    }
                } else {
                    tree.apply(ops)
                    if completion > 0 { engine.resolve(callback: completion, value: NSNull()) }
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
        // Not named `engine`: Swift 6.3 binds the callbacks' `engine` (above) to it.
        let jsEngine = engine!
        appEvents = AppEvents(
            send: { type in jsEngine.call("__swiftjsx_windowEvent", [type]) },
            afterJS: { done in jsEngine.perform { _ in done() } }
        )
        // Early, so a notification tap that launched the app isn't missed.
        NotificationHub.shared.install()
    }

    /// Load an app bundle from disk. With `hotReload`, the file is watched and
    /// changes are applied with React Refresh (pair with `npm run dev`).
    public convenience init(bundleURL: URL, hotReload: Bool = false, threading: JSThreading = .background,
                            native: NativeOptions? = nil) {
        self.init(threading: threading, native: native)
        load(bundleAt: bundleURL, hotReload: hotReload)
    }

    /// Loads an app bundle from disk; with `hotReload`, changes to the file are
    /// applied with React Refresh.
    public func load(bundleAt url: URL, hotReload: Bool = false) {
        bundleURL = url
        reload()
        if hotReload, watcher == nil { watch() }
    }

    isolated deinit {
        watcher?.invalidate()
        devServer?.stop()
        engine.stop()
    }

    @ObservationIgnored private var devServer: DevServerClient?

    /// Where React DevTools runs (`npx react-devtools`, port 8097): development
    /// bundles connect after loading. Set by the dev server client (the Mac
    /// serving the app) and for the simulator's on-disk bundle (loopback).
    public var devToolsHost: String? {
        didSet {
            if let devToolsHost, devToolsHost != oldValue, !isProduction, !tree.root.children.isEmpty {
                engine.call("__swiftjsx_connectDevTools", [devToolsHost])
            }
        }
    }

    func startDevServerClient(_ servers: [URL], fallback: URL?) {
        devServer = DevServerClient(runtime: self, servers: servers, fallback: fallback)
    }

    /// A failed dev build: show its errors (the red box) until the next good one.
    func showBuildError(_ message: String) {
        print("[swiftjsx] build failed:\n\(message)")
        error = message
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
        if let devToolsHost, !isProduction { engine.call("__swiftjsx_connectDevTools", [devToolsHost]) }
        NotificationHub.shared.attach(self)
    }

    /// An event for JS listeners (`__swiftjsx_emit`): notifications, speech.
    func emit(_ name: String, _ payload: Any) {
        engine.call("__swiftjsx_emit", [name, payload])
    }

    func resolveCommand(_ callback: Int, _ value: Any) {
        engine.resolve(callback: callback, value: value)
    }

    @ObservationIgnored private lazy var speaker = Speaker(runtime: self)

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
        case "share":
            let url = (args["url"] as? String).flatMap(URL.init(string:))
            shareItems(text: args["text"] as? String, url: url) { [engine] shared in
                engine?.resolve(callback: callback, value: shared)
            }
        case "prefetchImage":
            guard let url = (args["url"] as? String).flatMap(URL.init(string:)) else {
                return engine.resolve(callback: callback, value: false)
            }
            Task { [engine] in
                let loaded = (try? await ImageLoader.shared.load(url)) != nil
                engine?.resolve(callback: callback, value: loaded)
            }
        case "notificationsRequest", "notificationsStatus", "notificationsSchedule", "notificationsCancel", "notificationsPending", "badge":
            handleNotificationCommand(name, args) { [engine] value in engine?.resolve(callback: callback, value: value) }
        case "keepAwake":
            setKeepAwake(args["on"] as? Bool ?? false)
            engine.resolve(callback: callback, value: NSNull())
        case "speak":
            speaker.speak(args, callback: callback)
        case "speechStop", "speechPause", "speechResume":
            speaker.control(name)
            engine.resolve(callback: callback, value: NSNull())
        case "speechVoices":
            // Listing voices can take seconds the first time: not on main.
            Task.detached { [engine] in
                let voices = UncheckedSendable(Speaker.voices())
                await MainActor.run { engine?.resolve(callback: callback, value: voices.value) }
            }
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
        case "setSelection":
            let start = (args["start"] as? NSNumber)?.intValue ?? 0
            node.selectionRequest = SelectionRequest(seq: node.selectionRequest.seq + 1, start: start,
                                                     end: (args["end"] as? NSNumber)?.intValue ?? start)
        case "focus", "blur":
            node.focusRequest = FocusRequest(seq: node.focusRequest.seq + 1, focused: name == "focus")
        case "scrollTo":
            var target: AnyHashable =
                (args["node"] as? NSNumber).map { AnyHashable($0.intValue) }
                ?? (args["index"] as? NSNumber).map { AnyHashable($0.intValue) }
                ?? AnyHashable(args["edge"] as? String == "end" ? ScrollEdge.end : ScrollEdge.top)
            if node.type != "VirtualList", let id = scrollTarget(in: node, args) { target = AnyHashable(id) }
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

    /// The id to scroll to in a ScrollView, List or Form (VirtualList rows are
    /// found by index instead). An index is the n-th child; in a List or Form,
    /// a ref to a view inside a row scrolls to that row, since lists only
    /// know their rows' ids.
    private func scrollTarget(in container: Node, _ args: [String: Any]) -> Int? {
        if let index = (args["index"] as? NSNumber)?.intValue {
            let children = container.children.filter { !$0.isAttachment }
            return children.indices.contains(index) ? children[index].id : nil
        }
        guard container.type == "List" || container.type == "Form" else { return nil }
        if let edge = args["edge"] as? String {
            let children = container.children.filter { !$0.isAttachment }
            return (edge == "end" ? children.last : children.first)?.id
        }
        guard var row = (args["node"] as? NSNumber).flatMap({ tree.node($0.intValue) }) else { return nil }
        while let parent = row.parent, parent !== container, parent.type != "Section" {
            row = parent
        }
        return row.id
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
