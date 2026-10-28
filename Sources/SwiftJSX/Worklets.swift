import JavaScriptCore
import QuartzCore
import SwiftUI

/// Runs worklets: small JS functions that run on the main thread, in their own
/// JSContext, instead of on the JS thread with React.
///
/// - Gesture handlers that are worklets run synchronously inside the touch
///   event, so a dragged view moves in the same frame as the finger.
/// - Shared values (`useSharedValue`) live here; the JS thread writes them
///   with messages and gets changes back asynchronously.
/// - Animated styles (`useAnimatedStyle` → `animatedStyle` prop) re-run when
///   a shared value they read changes. Their result overrides those props on
///   the node (`Node.animatedProps`) without a React render.
/// - Animations (`withTiming`, `withSpring`, `withDecay`, `withSequence`,
///   `withRepeat`, `withDelay`) of numbers, and objects and arrays of them,
///   step here every frame (a display link runs while any is running), so
///   worklets read their current values, they end with callbacks, and springs
///   start at the speed of whatever they interrupt. Values that can't be
///   stepped (colors, booleans) are set once inside SwiftUI's `withAnimation`.
/// - Derived values (`useDerivedValue`) and reactions (`useAnimatedReaction`)
///   re-run when the shared values they read change.
/// - `<Canvas draw>` worklets record drawing commands (see CanvasHost), and
///   draw again when the shared values they read change.
///
/// Worklet functions arrive as `{ __worklet: { code, closure } }`, produced
/// by the worklets Babel pass (scripts/worklets-plugin.mjs).
@MainActor
final class WorkletRuntime {
    private let context: JSContext
    private let api: JSValue
    private weak var tree: NodeTree?
    /// Compiled gesture handlers per "node:event", reused while the prop is unchanged.
    private var handlers: [String: (source: NSDictionary, function: JSValue)] = [:]
    private let callJS: (Int, [Any]) -> Void
    private let syncToJS: ([String: Any]) -> Void
    private let report: (String) -> Void
    /// Animations of the steps the last flush applied ("none" if unanimated), for tests.
    private(set) var lastSteps: [String] = []
    /// Steps animations while any is running.
    private let ticker = FrameTicker()

    init(tree: NodeTree, callJS: @escaping (Int, [Any]) -> Void, syncToJS: @escaping ([String: Any]) -> Void,
         report: @escaping (String) -> Void) {
        self.tree = tree
        self.callJS = callJS
        self.syncToJS = syncToJS
        self.report = report
        context = JSContext(virtualMachine: JSVirtualMachine())!
        context.name = "SwiftJSX worklets"

        let host = JSValue(newObjectIn: context)!
        let log: @convention(block) (String) -> Void = { print("[worklet] \($0)") }
        host.setObject(log, forKeyedSubscript: "log" as NSString)
        // Worklets run on main: play it now.
        let haptic: @convention(block) (JSValue) -> Void = { kind in
            let name = kind.isString ? kind.toString() : nil
            MainActor.assumeIsolated { playHaptic(name) }
        }
        host.setObject(haptic, forKeyedSubscript: "haptic" as NSString)
        context.setObject(host, forKeyedSubscript: "__host" as NSString)
        api = context.evaluateScript(Self.prelude)!

        ticker.onFrame = { [weak self] now in self?.frame(now) }

        context.exceptionHandler = { _, exception in
            let message = exception?.toString() ?? "unknown error"
            let stack = exception?.objectForKeyedSubscript("stack")?.toString() ?? ""
            MainActor.assumeIsolated { report("Worklet error: \(message)\n\(stack)") }
        }
    }

    // MARK: From the node tree

    /// The node's `animatedStyle` prop was set, changed or removed.
    func setStyle(_ node: Node, _ worklet: Any?) {
        guard let worklet = worklet as? [String: Any], worklet["__worklet"] != nil else {
            removeStyle(node)
            return
        }
        let props = api.invokeMethod("setStyle", withArguments: [node.id, worklet])
        node.setAnimatedProps(props?.toDictionary() as? [String: Any] ?? [:])
        flush()
    }

    func removeStyle(_ node: Node) {
        api.invokeMethod("removeStyle", withArguments: [node.id])
        handlers = handlers.filter { !$0.key.hasPrefix("\(node.id):") }
    }

    // MARK: From views

    /// Whether the node's handler for `event` is a worklet.
    static func isWorklet(_ value: Any?) -> Bool {
        (value as? [String: Any])?["__worklet"] != nil
    }

    /// Runs a worklet event handler now, on the main thread.
    func run(_ node: Node, _ event: String, _ payload: Any?) {
        guard let source = node.props[event] as? [String: Any] else { return }
        let key = "\(node.id):\(event)"
        let dictionary = source as NSDictionary
        let function: JSValue
        if let cached = handlers[key], cached.source.isEqual(dictionary) {
            function = cached.function
        } else {
            guard let compiled = api.invokeMethod("compile", withArguments: [source["__worklet"]!]) else { return }
            function = compiled
            handlers[key] = (dictionary, compiled)
        }
        function.call(withArguments: payload.map { [$0] } ?? [])
        flush()
    }

    // MARK: From the JS thread

    /// `{ type: "create" | "set" | "delete", id, value }` for a shared value.
    func handle(_ message: [String: Any]) {
        api.invokeMethod("message", withArguments: [message])
        flush()
    }

    // MARK: Canvas

    /// The drawing commands of a `<Canvas draw>` worklet at this size (see
    /// CanvasHost). The canvas redraws when shared values it read change.
    func draw(_ node: Node, size: CGSize, time: Double) -> [Any] {
        guard let worklet = node.props["draw"] as? [String: Any], worklet["__worklet"] != nil else { return [] }
        let result = api.invokeMethod("draw", withArguments: [node.id, worklet, size.width, size.height, time])
        return result?.toArray() ?? []
    }

    // MARK: Frames

    private func frame(_ now: Double) {
        api.invokeMethod("frame", withArguments: [now])
        flush()
    }

    // MARK: Applying results

    /// Re-runs styles whose shared values changed and applies them, animated
    /// if the change was (`withSpring`, `withTiming`). Unanimated changes
    /// disable animations, so a dragged view never lags behind the finger.
    private func flush() {
        guard let result = api.invokeMethod("flush", withArguments: [])?.toDictionary() else { return }
        let updates = result["styles"] as? [Any] ?? []
        if !updates.isEmpty {
            lastSteps = updates.map { (($0 as? [String: Any])?["animation"] as? [String: Any])?["type"] as? String ?? "none" }
        }
        for case let update as [String: Any] in updates {
            guard let id = (update["node"] as? NSNumber)?.intValue, let node = tree?.node(id) else { continue }
            let props = update["props"] as? [String: Any] ?? [:]
            if let animation = parseAnimation(update["animation"]) {
                withAnimation(animation) { node.setAnimatedProps(props) }
            } else {
                var transaction = Transaction()
                transaction.disablesAnimations = true
                withTransaction(transaction) { node.setAnimatedProps(props) }
            }
        }
        for case let id as NSNumber in result["canvases"] as? [Any] ?? [] {
            tree?.node(id.intValue)?.canvasVersion += 1
        }
        if result["animating"] as? Bool == true { ticker.start() } else { ticker.stop() }
        if let values = result["values"] as? [String: Any], !values.isEmpty {
            syncToJS(values)
        }
        // After the sync, so JS-thread callbacks see the values the worklet wrote.
        for case let call as [Any] in result["calls"] as? [Any] ?? [] {
            guard let id = (call.first as? NSNumber)?.intValue else { continue }
            callJS(id, call.dropFirst().first as? [Any] ?? [])
        }
    }
}

/// Calls `onFrame(time)` every display frame while started (a display link on
/// iOS; a 60 Hz timer on the main queue elsewhere, which also runs where
/// nothing runs the main run loop, as in `swift test`). Time in seconds, `CACurrentMediaTime()`.
@MainActor
final class FrameTicker: NSObject {
    var onFrame: ((Double) -> Void)?
    #if os(iOS)
    private var link: CADisplayLink?
    #else
    private var timer: DispatchSourceTimer?
    #endif

    func start() {
        #if os(iOS)
        guard link == nil else { return }
        let link = CADisplayLink(target: self, selector: #selector(tick))
        link.preferredFrameRateRange = CAFrameRateRange(minimum: 60, maximum: 120, preferred: 120)
        link.add(to: .main, forMode: .common)
        self.link = link
        #else
        guard timer == nil else { return }
        let timer = DispatchSource.makeTimerSource(queue: .main)
        timer.schedule(deadline: .now(), repeating: .milliseconds(16))
        timer.setEventHandler { [weak self] in
            MainActor.assumeIsolated { self?.tick() }
        }
        timer.resume()
        self.timer = timer
        #endif
    }

    func stop() {
        #if os(iOS)
        link?.invalidate()
        link = nil
        #else
        timer?.cancel()
        timer = nil
        #endif
    }

    @objc private func tick() {
        onFrame?(CACurrentMediaTime())
    }
}
