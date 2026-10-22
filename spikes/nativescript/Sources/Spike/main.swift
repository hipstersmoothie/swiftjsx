// SPIKE: NativeScript (Node-API build) inside a SwiftJSX-style JavaScriptCore
// context. Run with `swift run -c release Spike` from spikes/nativescript.

import Foundation
import JavaScriptCore
import NodeAPIJSC

let root = URL(fileURLWithPath: #filePath)
    .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
let addon = root.appendingPathComponent("vendor/NativeScript.framework/Versions/0.1.0/NativeScript").path
let swiftjsxRuntime = root.deletingLastPathComponent().deletingLastPathComponent()
    .appendingPathComponent("Sources/SwiftJSX/Resources/runtime.js")

// Like SwiftJSX's JSEngine: JS lives on its own serial queue.
let jsQueue = DispatchQueue(label: "spike.js", qos: .userInteractive)
sjsx_set_js_queue(jsQueue)

/// Run on the JS queue *on a worker thread*. (`jsQueue.sync` from main would
/// execute the block on the main thread itself.)
func onJS(_ body: @escaping () -> Void) {
    let done = DispatchSemaphore(value: 0)
    jsQueue.async { body(); done.signal() }
    done.wait()
}

var failures = 0
func check(_ name: String, _ ok: Bool, _ detail: String = "") {
    print("\(ok ? "PASS" : "FAIL")  \(name)\(detail.isEmpty ? "" : "  →  \(detail)")")
    if !ok { failures += 1 }
}

var ctx: JSContext!
@discardableResult func js(_ source: String) -> JSValue { ctx.evaluateScript(source) }

onJS {
    ctx = JSContext()!
    ctx.exceptionHandler = { _, e in print("      JS exception: \(e?.toString() ?? "?")") }

    // --- 1. Attach to our context and load the add-on -------------------------
    print("== Load")
    let start = Date()
    let env = sjsx_napi_env_create(ctx.jsGlobalContextRef)
    if let error = sjsx_load_addon(env, addon, "__nativescript") {
        print("FAIL  dlopen: \(String(cString: error))")
        exit(1)
    }
    let loaded = Date()
    js("__nativescript.init()") // no path → metadata embedded in the add-on
    let initMs = Date().timeIntervalSince(loaded) * 1000
    check("attach to existing JSContext + init", js("typeof NSProcessInfo").toString() == "function",
          String(format: "dlopen %.0f ms, init %.0f ms", loaded.timeIntervalSince(start) * 1000, initMs))

    // --- 2. Calling native APIs ------------------------------------------------
    print("\n== Native APIs from JS (on the JS queue, not main)")
    let name = js("NSProcessInfo.processInfo.processName").toString() ?? ""
    check("class property → instance property → NSString", name == ProcessInfo.processInfo.processName, name)
    check("method with args", js("NSString.stringWithString('swiftjsx').uppercaseString").toString() == "SWIFTJSX")
    check("numbers", js("NSProcessInfo.processInfo.processorCount").toInt32() == Int32(ProcessInfo.processInfo.processorCount))
    let rect = js("(() => { const r = NSMakeRect(1, 2, 30, 40); return [r.origin.x, r.size.height].join(','); })()").toString()
    check("C function returning a struct", rect == "1,40", rect ?? "")
    let now = js("CFAbsoluteTimeGetCurrent()").toDouble()
    check("plain C function", abs(now - CFAbsoluteTimeGetCurrent()) < 5, "\(now)")
    check("JS sees it's off the main thread", js("NSThread.isMainThread").toBool() == false)

    // --- 3. Blocks -----------------------------------------------------------
    print("\n== JS functions as Objective-C blocks")
    let sorted = js("""
        NSArray.arrayWithArray([3, 1, 2])
          .sortedArrayUsingComparator((a, b) => (a < b ? -1 : a > b ? 1 : 0))
          .componentsJoinedByString(',')
        """).toString()
    check("block called synchronously on the JS thread", sorted == "1,2,3", sorted ?? "")

    js("""
        globalThis.received = [];
        globalThis.observer = NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
          'SpikeNote', null, null, (note) => { received.push(String(note.object)); });
        """)
}

if ProcessInfo.processInfo.environment["SPIKE_NAMESPACE"] != nil {
    onJS {
        print("\n== NativeScript in a sibling context, exposed as `native`")
        let app = JSContext(virtualMachine: ctx.virtualMachine)!   // same VM = same context group
        app.exceptionHandler = { _, e in print("      JS exception: \(e?.toString() ?? "?")") }
        let nsGlobal = JSValue(jsValueRef: JSContextGetGlobalObject(ctx.jsGlobalContextRef), in: app)
        app.setObject(nsGlobal, forKeyedSubscript: "native" as NSString)
        func appJS(_ s: String) -> String { app.evaluateScript(s)?.toString() ?? "nil" }

        check("app global scope stays clean", appJS("typeof NSProcessInfo + ',' + typeof open + ',' + Object.getOwnPropertyNames(globalThis).length") .hasPrefix("undefined,undefined,"),
              appJS("Object.getOwnPropertyNames(globalThis).length + ' globals'"))
        check("call through namespace", appJS("native.NSProcessInfo.processInfo.processName") == ProcessInfo.processInfo.processName)
        check("struct through namespace", appJS("native.NSMakeRect(1, 2, 3, 4).size.height") == "4")
        check("app-realm function as a block", appJS("native.NSArray.arrayWithArray([3, 1, 2]).sortedArrayUsingComparator((a, b) => (a < b ? -1 : a > b ? 1 : 0)).componentsJoinedByString('-')") == "1-2-3")
        appJS("globalThis.got = []; native.NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock('NsNote', null, null, (n) => got.push(String(n.object)));")
        globalApp = app
    }
    NotificationCenter.default.post(name: Notification.Name("NsNote"), object: "cross-realm" as NSString)
    onJS {
        check("cross-thread callback into the app realm", globalApp.evaluateScript("got.join()")?.toString() == "cross-realm")
        let bench = globalApp.evaluateScript("""
            (() => { const p = native.NSProcessInfo.processInfo; for (let i = 0; i < 1000; i++) p.processorCount;
              const t0 = Date.now(); for (let i = 0; i < 2e5; i++) p.processorCount; return ((Date.now() - t0) * 1e6 / 2e5).toFixed(0); })()
            """)?.toString() ?? "?"
        print("      cached object, int property via namespace: \(bench) ns")
    }
    print("\n\(failures == 0 ? "All checks passed" : "\(failures) check(s) failed")")
    exit(failures == 0 ? 0 : 1)
}
var globalApp: JSContext!

if ProcessInfo.processInfo.environment["SPIKE_ISOLATE"] != nil {
    onJS {
        print("\n== Global namespace")
        let names = ["pi", "setTimeout", "clearTimeout", "setInterval", "console", "performance", "queueMicrotask", "Text", "Image", "Button", "List", "Section", "render", "time", "close", "open", "free", "random", "exit", "printf", "sleep", "signal"]
        for name in names {
            print("      \(name.padding(toLength: 16, withPad: " ", startingAt: 0)) \(js("(() => { const d = Object.getOwnPropertyDescriptor(globalThis, '\(name)'); return d ? (d.get ? 'getter' : typeof d.value) : 'absent'; })()").toString() ?? "?")")
        }
        print("      total own globals: \(js("Object.getOwnPropertyNames(globalThis).length").toString() ?? "?")")

        print("\n== Isolating the cached-object slowdown")
        js("""
            globalThis.bench = (n, f) => { for (let i = 0; i < 1000; i++) f(); const t0 = Date.now(); for (let i = 0; i < n; i++) f(); return (((Date.now() - t0) * 1e6) / n).toFixed(0) + ' ns'; };
            """)
        for (label, code) in [
            ("fresh lookup each time", "bench(2e5, () => NSProcessInfo.processInfo.processorCount)"),
            ("global var, same object", "globalThis.procInfo = NSProcessInfo.processInfo; bench(2e5, () => procInfo.processorCount)"),
            ("closure const, same object", "(() => { const p = NSProcessInfo.processInfo; return bench(2e5, () => p.processorCount); })()"),
            ("closure const, other prop", "(() => { const p = NSProcessInfo.processInfo; return bench(2e5, () => p.activeProcessorCount); })()"),
            ("closure const, NSString.length", "(() => { const s = NSString.stringWithString('abc'); return bench(2e5, () => s.length); })()"),
            ("fresh NSString each time, .length", "bench(2e5, () => NSString.stringWithString('abc').length)"),
        ] {
            print("      \(label.padding(toLength: 36, withPad: " ", startingAt: 0)) \(js(code).toString() ?? "?")")
        }

        print("\n== Isolating memory growth (RSS after 3 × 200k, GC between)")
        for (label, code) in [
            ("C struct (NSMakeRect)", "NSMakeRect(0, 0, 1, 1).size.width"),
            ("C function returning double", "CFAbsoluteTimeGetCurrent()"),
            ("NSString → JS string", "NSString.stringWithString('x').length"),
            ("NSObject.new()", "NSObject.new()"),
            ("NSObject.new() in autoreleasepool", "objc.autoreleasepool(() => NSObject.new())"),
            ("plain JS objects (control)", "({ a: 1, b: [1, 2] })"),
        ] {
            var mb: [Double] = [residentMB()]
            for _ in 0..<3 {
                js("for (let i = 0; i < 200000; i++) { \(code); }")
                JSGarbageCollect(ctx.jsGlobalContextRef)
                mb.append(residentMB())
            }
            print("      \(label.padding(toLength: 36, withPad: " ", startingAt: 0)) " + mb.map { String(format: "%.0f", $0) }.joined(separator: " → ") + " MB")
            var info: [String] = []
            for (type, name) in [(1, "external"), (3, "reference"), (4, "wrapper")] {
                var c = 0, f = 0
                sjsx_counts(Int32(type), &c, &f)
                info.append("\(name) \(c - f) live")
            }
            print("          " + info.joined(separator: ", ") + ", \(sjsx_protected_refs()) strong refs")
        }
    }
    exit(0)
}

// Post from the main thread: NativeScript must hop to the JS queue (our
// threadsafe-function shim) and block main until JS has handled it.
print("")
let postStart = Date()
NotificationCenter.default.post(name: Notification.Name("SpikeNote"), object: "from-main" as NSString)
let postMs = Date().timeIntervalSince(postStart) * 1000
onJS {
    let got = js("received.join(',')").toString()
    check("block invoked from the main thread runs on the JS queue", got == "from-main",
          "\(got ?? "") (main blocked \(String(format: "%.2f", postMs)) ms)")
}

onJS {
    // --- 4. Overhead -----------------------------------------------------------
    print("\n== Overhead per call, best of 5 (JIT: \(ProcessInfo.processInfo.environment["JSC_useJIT"] == "false" ? "off, like iOS apps" : "on"))")
    let swiftNop: @convention(block) () -> Int = { 1 }
    ctx.setObject(swiftNop, forKeyedSubscript: "swiftNop" as NSString)
    js("""
        globalThis.bench = (n, f) => {
          for (let i = 0; i < 1000; i++) f();
          let best = Infinity;
          for (let round = 0; round < 5; round++) {
            const t0 = Date.now();
            for (let i = 0; i < n; i++) f();
            best = Math.min(best, ((Date.now() - t0) * 1e6) / n);
          }
          return best;
        };
        globalThis.pi = NSProcessInfo.processInfo;
        globalThis.str = NSString.stringWithString('hello world');
        """)
    let rows: [(String, String)] = [
        ("JS function (baseline)", "bench(1e6, () => Math.abs(-1))"),
        ("SwiftJSX-style host block", "bench(3e5, () => swiftNop())"),
        ("NS: cached object, int property", "bench(3e5, () => pi.processorCount)"),
        ("NS: class prop + int prop", "bench(3e5, () => NSProcessInfo.processInfo.processorCount)"),
        ("NS: NSString → JS string", "bench(3e5, () => str.uppercaseString)"),
        ("NS: C function", "bench(3e5, () => CFAbsoluteTimeGetCurrent())"),
        ("NS: struct-returning C fn", "bench(1e5, () => NSMakeRect(0, 0, 1, 1).size.width)"),
        ("NS: alloc/init NSObject", "bench(1e5, () => NSObject.new())"),
    ]
    for (label, code) in rows {
        let ns = js(code).toDouble()
        print(String(format: "      %-34@ %8.0f ns", label as NSString, ns))
    }

    // --- 5. React + hooks on top ---------------------------------------------
    print("\n== SwiftJSX's React runtime in the same context")
    js("""
        globalThis.commits = [];
        globalThis.__native = {
          commit: (ops) => commits.push(ops),
          command() {}, log: (l, m) => {}, fatal: (m) => { throw new Error(m) },
          schedule() {}, cancel() {},
        };
        globalThis.setTimeout = (f) => 0; globalThis.clearTimeout = () => {};
        globalThis.console = { log() {}, warn() {}, error() {}, info() {}, debug() {} };
        """)
    guard let runtime = try? String(contentsOf: swiftjsxRuntime, encoding: .utf8) else {
        return check("load runtime.js", false, swiftjsxRuntime.path)
    }
    js(runtime)
    check("runtime.js evaluates next to NativeScript globals", js("typeof __swiftjsx_modules.react.useState").toString() == "function")

    // A native-backed hook, written entirely in JS.
    js("""
        (() => {
          const React = __swiftjsx_modules.react;
          const { render, Text } = __swiftjsx_modules.swiftjsx;
          const { jsx } = __swiftjsx_modules['react/jsx-runtime'];

          function useNativeNotification(name, read) {
            return React.useSyncExternalStore(
              (onChange) => {
                const token = NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
                  name, null, null, onChange);
                return () => NSNotificationCenter.defaultCenter.removeObserver(token);
              },
              read,
            );
          }

          function Thermal() {
            const state = useNativeNotification(
              'NSProcessInfoThermalStateDidChangeNotification',
              () => NSProcessInfo.processInfo.thermalState,
            );
            const host = NSProcessInfo.processInfo.hostName;
            return jsx(Text, { children: `thermal ${state} on ${host}` });
          }
          render(jsx(Thermal, {}));
        })();
        """)
    let text = js("commits.flat().filter(o => o.op === 'text').map(o => o.text).join('')").toString() ?? ""
    check("hook backed by NSProcessInfo + NSNotificationCenter renders", text.hasPrefix("thermal "), text)

    // --- 6. Memory -------------------------------------------------------------
    print("\n== Memory (100k objects per round, GC between rounds)")
    var samples: [Double] = []
    for _ in 0..<5 {
        js("for (let i = 0; i < 100000; i++) objc.autoreleasepool(() => NSString.stringWithString('x' + i).length);")
        js("for (let i = 0; i < 100000; i++) NSObject.new();")
        JSGarbageCollect(ctx.jsGlobalContextRef)
        samples.append(residentMB())
    }
    let growth = samples.last! - samples[1]
    check("memory levels off (no per-object leak)", growth < 50,
          samples.map { String(format: "%.0f", $0) }.joined(separator: " → ") + " MB")
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

print("\n\(failures == 0 ? "All checks passed" : "\(failures) check(s) failed")")
exit(failures == 0 ? 0 : 1)
