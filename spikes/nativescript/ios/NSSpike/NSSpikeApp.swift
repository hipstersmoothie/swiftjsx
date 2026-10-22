// SPIKE (iOS): NativeScript's Node-API add-on inside a SwiftJSX-style
// JavaScriptCore context, with UIKit APIs. Results are printed and shown.

import JavaScriptCore
import NodeAPIJSC
import SwiftUI

/// Print a symbolicated backtrace to stderr on a crash (simulator crash reports
/// aren't being written on this machine).
private func installCrashBacktrace() {
    for sig in [SIGSEGV, SIGBUS, SIGABRT, SIGILL] {
        signal(sig) { sig in
            var frames = [UnsafeMutableRawPointer?](repeating: nil, count: 64)
            let n = backtrace(&frames, 64)
            let msg = "\n*** CRASH signal \(sig) on thread \(pthread_mach_thread_np(pthread_self())), stale weak returns so far: \(sjsx_stale_returns()) ***\n"
            write(2, msg, msg.utf8.count)
            backtrace_symbols_fd(&frames, n, 2)
            signal(sig, SIG_DFL)
            raise(sig)
        }
    }
}

@main
struct NSSpikeApp: App {
    @State private var log = SpikeLog()
    init() { installCrashBacktrace() }
    var body: some Scene {
        WindowGroup {
            ScrollView {
                Text(log.lines.joined(separator: "\n"))
                    .font(.system(size: 11, design: .monospaced))
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
            }
            .task { await log.run() }
        }
    }
}

@MainActor @Observable
final class SpikeLog {
    var lines: [String] = []
    private var failures = 0

    nonisolated func add(_ line: String) {
        print(line)
        Task { @MainActor in self.lines.append(line) }
    }

    nonisolated func check(_ name: String, _ ok: Bool, _ detail: String = "") {
        add("\(ok ? "PASS" : "FAIL")  \(name)\(detail.isEmpty ? "" : "  →  \(detail)")")
        if !ok { Task { @MainActor in self.failures += 1 } }
    }

    func run() async {
        let runner = SpikeRunner(log: self)
        if ProcessInfo.processInfo.environment["SPIKE_GUARD"] != nil {
            await GuardRunner(log: self).run()
            add("GUARD-DONE")
            return
        }
        if ProcessInfo.processInfo.environment["SPIKE_THREADMODEL"] != nil {
            await ThreadModelRunner(log: self).run()
            add("THREADMODEL-DONE")
            return
        }
        if ProcessInfo.processInfo.environment["SPIKE_THREADS"] != nil {
            await runner.threadIdentityExperiment()
            add("THREADS-DONE")
            return
        }
        if let mode = ProcessInfo.processInfo.environment["SPIKE_STRESS"] {
            await runner.onJS { runner.stress(weakMode: Int32(mode) ?? 2) }
            add("STRESS-DONE")
            return
        }
        await runner.onJS { runner.setUp() }
        // Native → JS from the main thread (must hop to the JS queue).
        let t0 = Date()
        NotificationCenter.default.post(name: Notification.Name("SpikeNote"), object: "from-main" as NSString)
        let blockedMs = Date().timeIntervalSince(t0) * 1000
        await runner.onJS { runner.afterPost(blockedMs: blockedMs) }
        try? await Task.sleep(for: .milliseconds(200))
        add("\n\(failures == 0 ? "All checks passed" : "\(failures) check(s) failed")")
        add("SPIKE-DONE")
    }
}

final class SpikeRunner: @unchecked Sendable {
    let log: SpikeLog
    let queue = DispatchQueue(label: "spike.js", qos: .userInteractive)
    var native: JSContext!   // NativeScript lives here…
    var app: JSContext!      // …and is exposed to the app realm as `native`.

    init(log: SpikeLog) {
        self.log = log
        sjsx_set_js_queue(queue)
    }

    func onJS(_ body: @escaping @Sendable () -> Void) async {
        await withCheckedContinuation { done in
            queue.async { body(); done.resume() }
        }
    }

    @discardableResult func js(_ s: String) -> JSValue { app.evaluateScript(s) }

    func setUp() {
        log.add("== Load (\(UIDevice.current.model), iOS \(UIDevice.current.systemVersion))")
        native = JSContext()!
        app = JSContext(virtualMachine: native.virtualMachine)!
        for c in [native!, app!] { c.exceptionHandler = { [log] _, e in log.add("   JS exception: \(e?.toString() ?? "?")") } }

        let addon = Bundle.main.privateFrameworksPath! + "/NativeScript.framework/NativeScript"
        let start = Date()
        let env = sjsx_napi_env_create(native.jsGlobalContextRef)
        if let error = sjsx_load_addon(env, addon, "__nativescript") {
            return log.check("dlopen add-on", false, String(cString: error))
        }
        let loaded = Date()
        native.evaluateScript("__nativescript.init()")
        let initMs = Date().timeIntervalSince(loaded) * 1000
        app.setObject(JSValue(jsValueRef: JSContextGetGlobalObject(native.jsGlobalContextRef), in: app), forKeyedSubscript: "native" as NSString)
        log.check("attach + init (embedded iOS metadata)", js("typeof native.UIDevice").toString() == "function",
                  String(format: "dlopen %.0f ms, init %.0f ms", loaded.timeIntervalSince(start) * 1000, initMs))
        log.check("app realm stays clean", js("typeof UIDevice").toString() == "undefined",
                  js("Object.getOwnPropertyNames(globalThis).length + ' app globals'").toString() ?? "")

        log.add("\n== UIKit from the JS queue")
        let model = js("native.UIDevice.currentDevice.model").toString() ?? ""
        log.check("UIDevice.currentDevice.model", model == UIDevice.current.model, model)
        let version = js("native.UIDevice.currentDevice.systemVersion").toString() ?? ""
        log.check("UIDevice.currentDevice.systemVersion", version == UIDevice.current.systemVersion, version)
        let scale = js("native.UIScreen.mainScreen.scale").toDouble()
        log.check("UIScreen.mainScreen.scale", scale >= 1, "\(scale)")
        let bounds = js("(() => { const b = native.UIScreen.mainScreen.bounds; return b.size.width + 'x' + b.size.height; })()").toString() ?? ""
        log.check("CGRect struct from UIScreen.bounds", bounds.contains("x"), bounds)
        // Property setter (on a non-main thread), then read back from JS and Swift.
        js("native.UIDevice.currentDevice.batteryMonitoringEnabled = true")
        let viaJS = js("native.UIDevice.currentDevice.batteryMonitoringEnabled").toBool()
        let viaSwift = DispatchQueue.main.sync { UIDevice.current.isBatteryMonitoringEnabled }
        log.check("property setter: batteryMonitoringEnabled = true", viaJS && viaSwift, "JS reads \(viaJS), Swift reads \(viaSwift)")
        let swiftCan = DispatchQueue.main.sync { () -> Bool in
            UIDevice.current.isBatteryMonitoringEnabled = true
            defer { UIDevice.current.isBatteryMonitoringEnabled = false }
            return UIDevice.current.isBatteryMonitoringEnabled
        }
        log.add("      (control: Swift on main sets it → reads \(swiftCan))")
        // (UIKit views must not be created off the main thread; use a non-UI object.)
        let label = js("(() => { const p = native.NSMutableParagraphStyle.new(); p.lineSpacing = 7; return p.lineSpacing; })()").toDouble()
        log.check("property setter on a fresh object", label == 7, "\(label)")
        log.check("JS is off the main thread", js("native.NSThread.isMainThread").toBool() == false)

        let sorted = js("native.NSArray.arrayWithArray([3, 1, 2]).sortedArrayUsingComparator((a, b) => (a < b ? -1 : a > b ? 1 : 0)).componentsJoinedByString(',')").toString()
        log.check("JS function as a block (sync)", sorted == "1,2,3", sorted ?? "")
        // void* returns that are really classes / protocols map back to their
        // constructors (PointerTypeConv::toJS lookups).
        log.check("void* → class constructor", js("native.CFRetain(native.interop.handleof(native.NSObject)) === native.NSObject").toBool(),
                  js("String(native.CFRetain(native.interop.handleof(native.NSObject)))").toString() ?? "")
        log.check("void* → protocol constructor", js("native.CFRetain(native.interop.handleof(native.NSCopying)) === native.NSCopying").toBool(),
                  js("String(native.CFRetain(native.interop.handleof(native.NSCopying)))").toString() ?? "")
        log.check("id → protocol constructor", js("native.NSProtocolFromString('NSCoding') === native.NSCoding").toBool(),
                  js("String(native.NSProtocolFromString('NSCoding'))").toString() ?? "")
        log.check("plain void* stays a Pointer", js("native.NSMutableData.dataWithLength(8).mutableBytes instanceof native.interop.Pointer").toBool())
        js("""
            globalThis.received = [];
            native.NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
              'SpikeNote', null, null, (n) => received.push(String(n.object)));
            """)
    }

    /// Allocation churn through the paths that crashed: ObjC object wrappers
    /// and raw-pointer wrappers (NativeScript's getCachedPointer cache).
    func stress(weakMode: Int32) {
        sjsx_set_weak_mode(weakMode)
        native = JSContext()!
        native.exceptionHandler = { [log] _, e in log.add("   JS exception: \(e?.toString() ?? "?")") }
        let env = sjsx_napi_env_create(native.jsGlobalContextRef)
        if let error = sjsx_load_addon(env, Bundle.main.privateFrameworksPath! + "/NativeScript.framework/NativeScript", "__nativescript") {
            return log.add("dlopen failed: \(String(cString: error))")
        }
        native.evaluateScript("__nativescript.init()")
        log.add("== Stress, weak mode \(weakMode) (\(["legacy", "legacy + stale detection", "WeakRef"][Int(weakMode)]))")
        var bad = 0
        let rounds = Int(ProcessInfo.processInfo.environment["SPIKE_ROUNDS"] ?? "10") ?? 10
        for round in 1...rounds {
            let t0 = Date()
            // Address reuse is what makes stale cache hits likely: freed
            // blocks come straight back from malloc.
            let result = autoreleasepool { native.evaluateScript("""
                (() => { let undef = 0;
                  for (let i = 0; i < 30000; i++) {
                    if (NSObject.new() === undefined) undef++;
                    const p = interop.alloc(16);
                    if (p === undefined) undef++;
                    interop.free(p);
                  }
                  return undef; })()
                """)!.toInt32() }
            bad += Int(result)
            JSGarbageCollect(native.jsGlobalContextRef)
            var refs = 0, weak = 0
            sjsx_ref_counts(&refs, &weak)
            var wc = 0, wf = 0
            sjsx_counts(4, &wc, &wf)
            log.add(String(format: "   round %2d  %4.0f ms  stale %ld  undef %d  RSS %.0f MB  live refs %ld (WeakRef-backed %ld)  live wrappers %ld",
                           round, Date().timeIntervalSince(t0) * 1000, sjsx_stale_returns(), result, residentMB(), refs, weak, wc - wf))
        }
        log.add("   total undefined results: \(bad)")
        log.add("   live refs by creating call site:")
        sjsx_dump_ref_sites { line in print("      " + String(cString: line!)) }
    }

    /// Does our GCD-backed "JS queue" keep a stable thread? NativeScript
    /// records the JS thread once and treats calls from any other thread as
    /// cross-thread (queue the block onto the JS queue and wait).
    func threadIdentityExperiment() async {
        await onJS { [self] in setUp() }
        var threads = Set<UInt32>()
        var deadlocks = 0, ok = 0
        for attempt in 1...12 {
            // Job 1: create a comparator closure (NativeScript records its thread).
            await onJS { [self] in
                threads.insert(pthread_mach_thread_np(pthread_self()))
                js("globalThis.sorter = native.NSSortDescriptor.sortDescriptorWithKeyAscendingComparator(null, true, (a, b) => (a < b ? -1 : a > b ? 1 : 0));")
            }
            // Let GCD retire/rotate worker threads between jobs.
            try? await Task.sleep(for: .milliseconds(attempt * 300))
            // Job 2: native code invokes that closure synchronously.
            let done = DispatchSemaphore(value: 0)
            var result = ""
            var thread: UInt32 = 0
            queue.async { [self] in
                thread = pthread_mach_thread_np(pthread_self())
                result = js("native.NSArray.arrayWithArray([3, 1, 2]).sortedArrayUsingDescriptors([sorter]).componentsJoinedByString(',')").toString() ?? "?"
                done.signal()
            }
            if done.wait(timeout: .now() + 3) == .timedOut {
                deadlocks += 1
                log.add("   attempt \(attempt): DEADLOCK (job ran on thread \(thread), JS queue stuck)")
                break
            }
            threads.insert(thread)
            ok += 1
            log.add("   attempt \(attempt): \(result) on thread \(thread)")
        }
        log.add("   distinct JS-queue threads seen: \(threads.count); ok \(ok), deadlocks \(deadlocks)")
    }

    func afterPost(blockedMs: Double) {
        log.check("block fired on main runs on the JS queue", js("received.join()").toString() == "from-main",
                  String(format: "main blocked %.2f ms", blockedMs))

        log.add("\n== Overhead per call (best of 5)")
        let swiftNop: @convention(block) () -> Int = { 1 }
        app.setObject(swiftNop, forKeyedSubscript: "swiftNop" as NSString)
        js("""
            globalThis.bench = (n, f) => {
              for (let i = 0; i < 1000; i++) f();
              let best = Infinity;
              for (let r = 0; r < 5; r++) { const t0 = Date.now(); for (let i = 0; i < n; i++) f(); best = Math.min(best, ((Date.now() - t0) * 1e6) / n); }
              return best;
            };
            globalThis.device = native.UIDevice.currentDevice;
            """)
        log.add("   struct-return probe (undefined results out of 5000):")
        for (label, code) in [
            ("UIScreen.mainScreen (object)", "native.UIScreen.mainScreen"),
            ("UIScreen.mainScreen.bounds", "native.UIScreen.mainScreen.bounds"),
            ("cached screen .bounds", "screen.bounds"),
            ("CGRectMake(1,2,3,4)", "native.CGRectMake(1, 2, 3, 4)"),
            ("CGRectMake(...).size", "native.CGRectMake(1, 2, 3, 4).size"),
            ("NSMakeRange(1, 2)", "native.NSMakeRange(1, 2)"),
        ] {
            let bad = js("(() => { globalThis.screen = native.UIScreen.mainScreen; let bad = 0, first = -1; for (let i = 0; i < 5000; i++) { if (\(code) === undefined) { bad++; if (first < 0) first = i; } } return bad + (first >= 0 ? ' (first at ' + first + ')' : ''); })()").toString() ?? "?"
            log.add("      \(label.padding(toLength: 30, withPad: " ", startingAt: 0)) \(bad)")
        }
        log.add("   NSObject.new() scaling (µs/op per batch of 20k):")
        var batches: [String] = []
        for _ in 0..<5 {
            let t0 = Date()
            js("for (let i = 0; i < 20000; i++) native.NSObject.new();")
            batches.append(String(format: "%.1f", Date().timeIntervalSince(t0) * 1e6 / 20000))
        }
        log.add("      " + batches.joined(separator: " → "))
        for (label, code) in [
            ("JS function (baseline)", "bench(5e5, () => Math.abs(-1))"),
            ("SwiftJSX host block", "bench(1e5, () => swiftNop())"),
            ("device.batteryLevel (cached obj)", "bench(1e5, () => device.batteryLevel)"),
            ("UIDevice.currentDevice.model", "bench(1e5, () => native.UIDevice.currentDevice.model)"),
            ("UIScreen.mainScreen.bounds", "bench(5e4, () => native.UIScreen.mainScreen.bounds.size.width)"),
            ("NSObject.new()", "bench(5e4, () => native.NSObject.new())"),
            ("void* return (data.mutableBytes)", "(() => { const d = native.NSMutableData.dataWithLength(16); return bench(2e3, () => d.mutableBytes); })()"),
            ("id return (NSArray.firstObject)", "(() => { const a = native.NSArray.arrayWithArray([native.NSObject.new()]); return bench(2e4, () => a.firstObject); })()"),
        ] {
            let t0 = Date()
            let ns = js(code).toDouble()
            log.add(String(format: "   %-34@ %7.0f ns   (%.1f s)", label as NSString, ns, Date().timeIntervalSince(t0)))
        }
    }
}

func residentMB() -> Double {
    var info = mach_task_basic_info()
    var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size) / 4
    let kr = withUnsafeMutablePointer(to: &info) {
        $0.withMemoryRebound(to: integer_t.self, capacity: Int(count)) {
            task_info(mach_task_self_, task_flavor_t(MACH_TASK_BASIC_INFO), $0, &count)
        }
    }
    return kr == KERN_SUCCESS ? Double(info.resident_size) / 1_048_576 : 0
}
