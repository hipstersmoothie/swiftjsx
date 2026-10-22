import Foundation
import JavaScriptCore
import SwiftJSXNodeAPI

/// Where JavaScript runs.
public enum JSThreading: Sendable {
    /// Everything on the main thread. Native events re-render synchronously,
    /// which makes tests deterministic, but heavy renders block the UI.
    case main
    /// A dedicated JS thread with its own run loop (the default). The UI never
    /// waits on React; commits are applied on the main thread as they arrive.
    case background
}

/// The optional `native` backend: NativeScript's Node-API add-on, giving JS
/// direct access to Objective-C / C APIs as `native.UIDevice…`.
public struct NativeOptions: Sendable {
    /// The add-on binary (`…/NativeScript.framework/NativeScript`), built with
    /// SwiftJSX's patches by `scripts/build-nativescript.sh`.
    public var addonURL: URL
    /// Throw a JS error when JS calls @MainActor API off the main thread
    /// (instead of crashing in UIKit). Needs an add-on that supports it.
    public var mainThreadGuard: Bool

    public init(addonURL: URL, mainThreadGuard: Bool = true) {
        self.addonURL = addonURL
        self.mainThreadGuard = mainThreadGuard
    }

    /// The add-on embedded in the app bundle (`Frameworks/NativeScript.framework`), if any.
    public static var embedded: NativeOptions? {
        guard let frameworks = Bundle.main.privateFrameworksPath else { return nil }
        let candidates = ["/NativeScript.framework/NativeScript", "/NativeScript.framework/Versions/A/NativeScript"]
        return candidates.map { URL(fileURLWithPath: frameworks + $0) }
            .first { FileManager.default.fileExists(atPath: $0.path) }
            .map { NativeOptions(addonURL: $0) }
    }
}

/// Results from JS, delivered on the main thread.
struct EngineCallbacks: Sendable {
    var commit: @MainActor @Sendable ([[String: Any]]) -> Void
    var command: @MainActor @Sendable (_ id: Int, _ name: String, _ args: [String: Any], _ callback: Int) -> Void
    var fatal: @MainActor @Sendable (String) -> Void
}

/// The JS thread: a plain thread running a CFRunLoop. (A GCD queue won't do:
/// its worker threads change between jobs, and NativeScript ties callbacks to
/// the thread they were created on, which deadlocked.)
final class JSThread: Thread, @unchecked Sendable {
    private(set) var runLoop: CFRunLoop!
    private let ready = DispatchSemaphore(value: 0)

    override func main() {
        runLoop = CFRunLoopGetCurrent()
        var context = CFRunLoopSourceContext()   // keeps the run loop alive
        CFRunLoopAddSource(runLoop, CFRunLoopSourceCreate(nil, 0, &context), .commonModes)
        ready.signal()
        CFRunLoopRun()
    }

    func startAndWait() {
        name = "SwiftJSX.js"
        qualityOfService = .userInteractive
        start()
        ready.wait()
    }

    /// Runs `block` on the JS thread. Each unit of work first lets a waiting
    /// main thread into the VM (JSC's VM lock is unfair; see SwiftJSXNodeAPI.h).
    func perform(_ block: @escaping @Sendable () -> Void) {
        CFRunLoopPerformBlock(runLoop, CFRunLoopMode.commonModes.rawValue) {
            swiftjsx_wait_while_main_waiting()
            block()
        }
        CFRunLoopWakeUp(runLoop)
    }
}

/// NativeScript keeps process-wide state, so it's initialized once, into one
/// VM, bound to one JS thread. Every runtime with the native backend shares
/// them (each still gets its own app context).
final class NativeHost: @unchecked Sendable {
    let threading: JSThreading
    let thread: JSThread?
    let vm = JSVirtualMachine()!
    let addonPath: String
    private(set) var context: JSContext?
    private(set) var loadError: String?

    private static let lock = NSLock()
    nonisolated(unsafe) private static var shared: NativeHost?

    /// The process's native host, created on first use.
    static func host(threading: JSThreading, options: NativeOptions) -> Result<NativeHost, NativeHostError> {
        lock.withLock {
            if let shared {
                guard shared.threading == threading else { return .failure(.threadingMismatch(shared.threading)) }
                guard shared.addonPath == options.addonURL.path else { return .failure(.addonMismatch(shared.addonPath)) }
                return .success(shared)
            }
            let host = NativeHost(threading: threading, options: options)
            shared = host
            return .success(host)
        }
    }

    private init(threading: JSThreading, options: NativeOptions) {
        self.threading = threading
        addonPath = options.addonURL.path
        if threading == .background {
            let thread = JSThread()
            thread.startAndWait()
            self.thread = thread
        } else {
            thread = nil
        }
        let load: @Sendable () -> Void = { [self] in
            let nctx = JSContext(virtualMachine: vm)!
            nctx.name = "SwiftJSX native"
            swiftjsx_set_js_runloop(thread?.runLoop ?? CFRunLoopGetMain())
            let env = swiftjsx_napi_env_create(nctx.jsGlobalContextRef)
            if let error = swiftjsx_load_nativescript(env, addonPath, true, options.mainThreadGuard) {
                loadError = String(cString: error)
                free(error)
            } else {
                context = nctx
            }
        }
        // NativeScript records the thread it's initialized on as its JS thread.
        if let thread {
            let done = DispatchSemaphore(value: 0)
            thread.perform { load(); done.signal() }
            done.wait()
        } else if Thread.isMainThread {
            load()
        } else {
            DispatchQueue.main.sync(execute: load)
        }
    }
}

enum NativeHostError: Error, CustomStringConvertible {
    case threadingMismatch(JSThreading)
    case addonMismatch(String)

    var description: String {
        switch self {
        case .threadingMismatch(let t):
            "the native backend is already running with threading .\(t) in this process; use the same threading for every native runtime"
        case .addonMismatch(let path):
            "the native backend is already loaded from \(path) in this process"
        }
    }
}

/// Owns the JS contexts. JS normally runs on the JS thread (or main, in
/// `.main` mode); with the native backend, native callbacks can also run JS on
/// the thread that fires them (main, for UIKit), serialized by JSC's VM lock.
/// So the engine's own state is guarded by `lock`.
final class JSEngine: @unchecked Sendable {
    let threading: JSThreading
    private let thread: JSThread?
    private let callbacks: EngineCallbacks
    private let nativeOptions: NativeOptions?
    private let lock = NSLock()
    private var _context: JSContext?
    private var timers: [Int: AnyObject] = [:]   // CFRunLoopTimer or DispatchWorkItem
    private var generation = 0
    /// One VM for the engine's lifetime (reloads make a new app context in
    /// it). With the native backend, the VM and JS thread are the shared
    /// NativeHost's.
    private let vm: JSVirtualMachine
    private let nativeHost: NativeHost?
    private let nativeError: String?

    init(threading: JSThreading, native: NativeOptions? = nil, callbacks: EngineCallbacks) {
        self.threading = threading
        self.callbacks = callbacks
        self.nativeOptions = native
        var host: NativeHost?
        var error: String?
        if let native {
            switch NativeHost.host(threading: threading, options: native) {
            case .success(let h): host = h; error = h.loadError
            case .failure(let e): error = e.description
            }
        }
        nativeHost = host?.context != nil ? host : nil
        nativeError = error
        if let host {
            vm = host.vm
            thread = host.thread
        } else {
            vm = JSVirtualMachine()!
            if threading == .background {
                let thread = JSThread()
                thread.startAndWait()
                self.thread = thread
            } else {
                thread = nil
            }
        }
    }

    private var context: JSContext? {
        lock.withLock { _context }
    }

    /// Run `block` where JS lives: the JS thread, or main in `.main` mode
    /// (inline if already on main).
    private func onJSThread(_ block: @escaping @Sendable () -> Void) {
        if let thread {
            thread.perform(block)
        } else if Thread.isMainThread {
            block()
        } else {
            DispatchQueue.main.async(execute: block)
        }
    }

    /// Run `work` against the current app context on the JS thread.
    func perform(_ work: @escaping @Sendable (JSContext) -> Void) {
        onJSThread { [self] in context.map(work) }
    }

    /// Deliver a result to the main thread (inline if we're already there).
    private func toMain(_ work: @escaping @MainActor @Sendable () -> Void) {
        if Thread.isMainThread {
            MainActor.assumeIsolated(work)
        } else {
            DispatchQueue.main.async(execute: work)
        }
    }

    // MARK: Lifecycle

    /// Fresh app context: polyfills, then the runtime, then the app.
    func start(runtime: String, app: String, appURL: URL?) {
        onJSThread { [self] in
            stopTimers()
            let ctx = JSContext(virtualMachine: vm)!
            ctx.name = "SwiftJSX"
            ctx.exceptionHandler = { [weak self] _, exception in
                self?.reportException(exception)
            }
            lock.withLock { _context = ctx }
            installHost(in: ctx)
            installNative(in: ctx)
            ctx.evaluateScript(Self.prelude)
            ctx.evaluateScript(runtime, withSourceURL: URL(string: "swiftjsx://runtime.js"))
            ctx.evaluateScript(app, withSourceURL: appURL)
        }
    }

    /// Re-run an updated app bundle in the existing context and let React
    /// Refresh swap the changed components in place (state is kept).
    func hotUpdate(app: String, appURL: URL?) {
        perform { ctx in
            ctx.evaluateScript(app, withSourceURL: appURL)
            ctx.objectForKeyedSubscript("__swiftjsx_hotUpdate")?.call(withArguments: [])
        }
    }

    func stop() {
        onJSThread { [self] in
            stopTimers()
            lock.withLock { _context = nil }
        }
    }

    // MARK: Calls into JS

    func dispatch(_ id: Int, _ event: String, _ payload: Any?, seq: Int?) {
        let args = UncheckedSendable([id, event, payload ?? NSNull(), seq ?? NSNull()] as [Any])
        perform { ctx in
            ctx.objectForKeyedSubscript("__dispatch")?.call(withArguments: args.value)
        }
    }

    func resolve(callback: Int, value: Any) {
        let args = UncheckedSendable([callback, value] as [Any])
        perform { ctx in
            ctx.objectForKeyedSubscript("__resolveCommand")?.call(withArguments: args.value)
        }
    }

    // MARK: Host functions (called by JS; usually on the JS thread)

    private func installHost(in ctx: JSContext) {
        let native = JSValue(newObjectIn: ctx)!
        let callbacks = self.callbacks

        let commit: @convention(block) (JSValue) -> Void = { [weak self] ops in
            let list = UncheckedSendable(ops.toArray() as? [[String: Any]] ?? [])
            self?.toMain { callbacks.commit(list.value) }
        }
        let command: @convention(block) (Int, String, JSValue, Int) -> Void = { [weak self] id, name, args, callback in
            let dict = UncheckedSendable(args.isObject ? (args.toDictionary() as? [String: Any] ?? [:]) : [:])
            self?.toMain { callbacks.command(id, name, dict.value, callback) }
        }
        let schedule: @convention(block) (Int, Double) -> Void = { [weak self] id, ms in
            self?.schedule(id, ms)
        }
        let cancel: @convention(block) (Int) -> Void = { [weak self] id in
            self?.cancelTimer(id)
        }
        let log: @convention(block) (String, String) -> Void = { level, message in
            print("[js:\(level)] \(message)")
        }
        let fatal: @convention(block) (String) -> Void = { [weak self] message in
            self?.toMain { callbacks.fatal(message) }
        }

        native.setObject(commit, forKeyedSubscript: "commit" as NSString)
        native.setObject(command, forKeyedSubscript: "command" as NSString)
        native.setObject(schedule, forKeyedSubscript: "schedule" as NSString)
        native.setObject(cancel, forKeyedSubscript: "cancel" as NSString)
        native.setObject(log, forKeyedSubscript: "log" as NSString)
        native.setObject(fatal, forKeyedSubscript: "fatal" as NSString)
        ctx.setObject(native, forKeyedSubscript: "__native" as NSString)
    }

    private func reportException(_ exception: JSValue?) {
        let message = exception?.toString() ?? "unknown error"
        let stack = exception?.objectForKeyedSubscript("stack")?.toString() ?? ""
        let callbacks = self.callbacks
        toMain { callbacks.fatal("\(message)\n\(stack)") }
    }

    // MARK: Native backend

    /// Exposes NativeScript (its own context in our VM, so its ~90k globals
    /// stay out of the app's scope) as `native`.
    private func installNative(in ctx: JSContext) {
        guard let options = nativeOptions else { return }
        if let nativeError {
            let callbacks = self.callbacks
            toMain { callbacks.fatal("native backend unavailable: \(nativeError)") }
            return
        }
        guard let nativeContext = nativeHost?.context else { return }
        ctx.setObject(JSValue(jsValueRef: JSContextGetGlobalObject(nativeContext.jsGlobalContextRef), in: ctx),
                      forKeyedSubscript: "native" as NSString)
        ctx.setObject(swiftjsx_nativescript_has_main_thread_guard() && options.mainThreadGuard,
                      forKeyedSubscript: "__swiftjsx_mainThreadGuard" as NSString)

        // onMain(fn): run fn on the main thread, settle back on the JS thread.
        // (js/native.ts wraps fn so it never throws across the hop.)
        let background = threading == .background
        let hop: @convention(block) (JSValue, JSValue) -> Void = { [weak self] fn, settle in
            let values = UncheckedSendable((fn, settle))
            DispatchQueue.main.async {
                if background { swiftjsx_main_enter() }
                let result = UncheckedSendable(values.value.0.call(withArguments: []))
                if background { swiftjsx_main_exit() }
                self?.onJSThread { values.value.1.call(withArguments: [result.value as Any]) }
            }
        }
        ctx.setObject(hop, forKeyedSubscript: "__swiftjsx_mainHop" as NSString)
    }

    // MARK: Timers

    private func schedule(_ id: Int, _ ms: Double) {
        let delay = max(ms, 0) / 1000
        let generation = lock.withLock { self.generation }
        let fire: @Sendable () -> Void = { [weak self] in
            guard let self else { return }
            let live = self.lock.withLock { () -> Bool in
                guard self.generation == generation else { return false }
                return self.timers.removeValue(forKey: id) != nil
            }
            guard live else { return }
            self.context?.objectForKeyedSubscript("__fireTimer")?.call(withArguments: [id])
        }
        let timer: AnyObject
        if let thread {
            let t = CFRunLoopTimerCreateWithHandler(kCFAllocatorDefault, CFAbsoluteTimeGetCurrent() + delay, 0, 0, 0) { _ in
                swiftjsx_wait_while_main_waiting()
                fire()
            }!
            CFRunLoopAddTimer(thread.runLoop, t, .commonModes)
            timer = t
        } else {
            let item = DispatchWorkItem(block: fire)
            DispatchQueue.main.asyncAfter(deadline: .now() + delay, execute: item)
            timer = item
        }
        let previous = lock.withLock { () -> AnyObject? in
            let previous = timers[id]
            timers[id] = timer
            return previous
        }
        previous.map(Self.invalidate)
    }

    private func cancelTimer(_ id: Int) {
        lock.withLock { timers.removeValue(forKey: id) }.map(Self.invalidate)
    }

    private func stopTimers() {
        let all = lock.withLock { () -> [AnyObject] in
            generation += 1
            defer { timers = [:] }
            return Array(timers.values)
        }
        all.forEach(Self.invalidate)
    }

    private static func invalidate(_ timer: AnyObject) {
        if let item = timer as? DispatchWorkItem {
            item.cancel()
        } else {
            CFRunLoopTimerInvalidate((timer as! CFRunLoopTimer))
        }
    }

    /// The bits of a browser/Node environment that React and the scheduler
    /// expect: timers, microtasks, console, performance.now.
    /// Timer callbacks live in JS; Swift only stores ids, so no JSValues are
    /// retained across the bridge.
    static let prelude = #"""
    (function () {
      var g = globalThis, timers = new Map(), nextId = 1;
      function add(fn, ms, args, repeat) {
        var id = nextId++;
        timers.set(id, { fn: fn, args: args, ms: ms || 0, repeat: repeat });
        __native.schedule(id, ms || 0);
        return id;
      }
      function clear(id) { if (timers.delete(id)) __native.cancel(id); }
      g.setTimeout = function (fn, ms) { return add(fn, ms, [].slice.call(arguments, 2), false); };
      g.setInterval = function (fn, ms) { return add(fn, ms, [].slice.call(arguments, 2), true); };
      g.clearTimeout = g.clearInterval = clear;
      g.__fireTimer = function (id) {
        var t = timers.get(id);
        if (!t) return;
        if (t.repeat) __native.schedule(id, t.ms); else timers.delete(id);
        t.fn.apply(null, t.args);
      };
      if (typeof g.queueMicrotask !== "function")
        g.queueMicrotask = function (fn) { Promise.resolve().then(fn); };
      if (typeof g.performance === "undefined")
        g.performance = { now: function () { return Date.now(); } };
      function fmt(args) {
        return [].map.call(args, function (a) {
          if (typeof a === "string") return a;
          if (a instanceof Error) return a.message + "\n" + a.stack;
          try { return JSON.stringify(a); } catch (e) { return String(a); }
        }).join(" ");
      }
      g.console = {
        log: function () { __native.log("log", fmt(arguments)); },
        info: function () { __native.log("info", fmt(arguments)); },
        debug: function () { __native.log("debug", fmt(arguments)); },
        warn: function () { __native.log("warn", fmt(arguments)); },
        error: function () { __native.log("error", fmt(arguments)); },
      };
    })();
    """#
}

/// Foundation values decoded from JS (dictionaries of NSNumber/NSString…) are
/// immutable once built; this lets them cross to the main thread.
struct UncheckedSendable<T>: @unchecked Sendable {
    let value: T
    init(_ value: T) { self.value = value }
}
