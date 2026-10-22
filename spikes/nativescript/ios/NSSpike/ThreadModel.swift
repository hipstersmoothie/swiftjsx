// SPIKE: threading model for NativeScript + SwiftJSX on iOS.
//
//   - JS owns a dedicated thread with a running run loop (not a GCD queue, whose
//     worker threads change between jobs and break NativeScript's thread checks).
//   - Native callbacks that fire on the main thread run their JS on main, inline
//     (JSC's VM lock serializes this with the JS thread).
//   - `onMain(fn)` runs fn on main and resolves back on the JS thread; the JS
//     thread never waits for main, so it can't deadlock against it.

import JavaScriptCore
import MachO
import NodeAPIJSC
import UIKit

/// A thread that runs a CFRunLoop forever and accepts blocks.
final class JSThread: Thread, @unchecked Sendable {
    private(set) var runLoop: CFRunLoop!
    private let ready = DispatchSemaphore(value: 0)

    override func main() {
        runLoop = CFRunLoopGetCurrent()
        // A run loop with no sources exits immediately; keep one installed.
        var context = CFRunLoopSourceContext()
        let keepAlive = CFRunLoopSourceCreate(nil, 0, &context)
        CFRunLoopAddSource(runLoop, keepAlive, .commonModes)
        ready.signal()
        CFRunLoopRun()
    }

    func startAndWait() {
        name = "SwiftJSX.js"
        qualityOfService = .userInteractive
        start()
        ready.wait()
    }

    /// Gate main-thread priority (SPIKE_NO_PRIORITY disables it).
    static let mainPriority = ProcessInfo.processInfo.environment["SPIKE_NO_PRIORITY"] == nil

    func perform(_ block: @escaping @Sendable () -> Void) {
        CFRunLoopPerformBlock(runLoop, CFRunLoopMode.commonModes.rawValue) {
            // Outside the VM lock: let a waiting main thread in first.
            if JSThread.mainPriority { while sjsx_main_waiting() > 0 { usleep(20) } }
            block()
        }
        CFRunLoopWakeUp(runLoop)
    }

    func run<T>(_ block: @escaping @Sendable () -> T) async -> T {
        await withCheckedContinuation { continuation in
            perform { continuation.resume(returning: block()) }
        }
    }
}

final class ThreadModelRunner: @unchecked Sendable {
    let log: SpikeLog
    let thread = JSThread()
    var native: JSContext!
    var app: JSContext!

    init(log: SpikeLog) {
        self.log = log
    }

    @discardableResult func js(_ s: String) -> JSValue { app.evaluateScript(s) }
    func onJS(_ body: @escaping @Sendable () -> Void) async { await thread.run(body) }

    func setUp() async {
        thread.startAndWait()
        sjsx_set_js_runloop(thread.runLoop)
        await onJS { [self] in
            native = JSContext()!
            app = JSContext(virtualMachine: native.virtualMachine)!
            for c in [native!, app!] { c.exceptionHandler = { [log] _, e in log.add("   JS exception: \(e?.toString() ?? "?")") } }
            let env = sjsx_napi_env_create(native.jsGlobalContextRef)
            if let error = sjsx_load_addon(env, Bundle.main.privateFrameworksPath! + "/NativeScript.framework/NativeScript", "__nativescript") {
                return log.add("dlopen failed: \(String(cString: error))")
            }
            native.evaluateScript("__nativescript.init()")  // NativeScript records this thread + run loop
            sjsx_set_main_inline(ProcessInfo.processInfo.environment["SPIKE_NO_INLINE"] == nil ? 1 : 0)
            app.setObject(JSValue(jsValueRef: JSContextGetGlobalObject(native.jsGlobalContextRef), in: app), forKeyedSubscript: "native" as NSString)
            installOnMain()
        }
    }

    /// onMain(fn): run fn on the main thread; the promise settles on the JS thread.
    func installOnMain() {
        let hop: @convention(block) (JSValue, JSValue, JSValue) -> Void = { [thread] fn, resolve, reject in
            DispatchQueue.main.async {
                let context = fn.context!
                sjsx_main_enter(); defer { sjsx_main_exit() }
                let result = fn.call(withArguments: [])
                let error = context.exception
                context.exception = nil
                thread.perform {
                    if let error { reject.call(withArguments: [error]) } else { resolve.call(withArguments: [result as Any]) }
                }
            }
        }
        app.setObject(hop, forKeyedSubscript: "__mainHop" as NSString)
        js("globalThis.onMain = (fn) => new Promise((resolve, reject) => __mainHop(fn, resolve, reject));")
    }

    /// Await a JS promise from Swift.
    func await(_ expression: String) async -> JSValue? {
        await withCheckedContinuation { continuation in
            thread.perform { [self] in
                let settle: @convention(block) (JSValue) -> Void = { continuation.resume(returning: $0) }
                let fail: @convention(block) (JSValue) -> Void = { [log] e in
                    log.add("   rejected: \(e.toString() ?? "?")"); continuation.resume(returning: nil)
                }
                let promise = js("(async () => { \(expression) })()")
                promise.invokeMethod("then", withArguments: [JSValue(object: settle, in: app)!, JSValue(object: fail, in: app)!])
            }
        }
    }

    /// Hands a JS-held native object to Swift: JS posts it as a notification
    /// object (on main) and a Swift observer keeps it.
    @MainActor static var handedOff: [String: AnyObject] = [:]
    @MainActor static var observer: NSObjectProtocol?

    func objc<T: AnyObject>(_ key: String, as: T.Type) async -> T? {
        await MainActor.run {
            if Self.observer == nil {
                Self.observer = NotificationCenter.default.addObserver(forName: nil, object: nil, queue: nil) { note in
                    let name = note.name.rawValue
                    guard name.hasPrefix("SpikeHandOff."), let object = note.object as AnyObject? else { return }
                    MainActor.assumeIsolated { Self.handedOff[String(name.dropFirst("SpikeHandOff.".count))] = object }
                }
            }
        }
        _ = await self.await("await onMain(() => native.NSNotificationCenter.defaultCenter.postNotificationNameObject('SpikeHandOff.\(key)', \(key)));")
        return await MainActor.run { Self.handedOff[key] as? T }
    }

    func run() async {
        await setUp()
        let mtc = (0..<_dyld_image_count()).contains { String(cString: _dyld_get_image_name($0)).contains("libMainThreadChecker") }
        log.add("== Threading model (JS thread + main-inline callbacks). Main Thread Checker loaded: \(mtc)")

        // 1. Thread identity: the deadlock scenario from the GCD queue.
        var threads = Set<UInt32>()
        var ok = 0
        for attempt in 1...8 {
            await onJS { [self] in
                js("globalThis.sorter = native.NSSortDescriptor.sortDescriptorWithKeyAscendingComparator(null, true, (a, b) => (a < b ? -1 : a > b ? 1 : 0));")
            }
            try? await Task.sleep(for: .milliseconds(attempt * 300))
            let result = await withTaskGroup(of: String?.self) { group in
                group.addTask { [self] in
                    await thread.run { [self] in
                        threads.insert(pthread_mach_thread_np(pthread_self()))
                        return js("native.NSArray.arrayWithArray([3, 1, 2]).sortedArrayUsingDescriptors([sorter]).componentsJoinedByString(',')").toString()
                    }
                }
                group.addTask { try? await Task.sleep(for: .seconds(3)); return nil }
                let first = await group.next()!
                group.cancelAll()
                return first
            }
            if result == "1,2,3" { ok += 1 } else { log.add("   attempt \(attempt): \(result ?? "DEADLOCK")"); break }
        }
        log.check("closure created in one job, called in a later job (8×, up to 2.4 s apart)", ok == 8,
                  "\(ok)/8 ok, \(threads.count) JS thread(s)")

        // 2. The bad pattern, for contrast: UIKit from the JS thread.
        log.add("   MTC-EXPECTED-BEGIN")
        await onJS { [self] in js("globalThis.offMain = native.UIView.new(); offMain.tag = 7;") }
        log.add("   MTC-EXPECTED-END")

        // 3. onMain: build views on main from JS.
        let made = await self.await("""
            return await onMain(() => {
              const label = native.UILabel.new();
              label.text = 'made on ' + (native.NSThread.isMainThread ? 'main' : 'background');
              globalThis.label = label;
              return label.text;
            });
            """)
        log.check("onMain(fn) runs UIKit on main, resolves back on JS thread",
                  made?.toString() == "made on main", made?.toString() ?? "nil")
        let continuation = await self.await("await onMain(() => 1); return native.NSThread.isMainThread;")
        log.check("code after `await onMain(...)` continues off main", continuation?.toBool() == false)

        // 4. Target-action implemented in JS, fired by UIKit on main.
        _ = await self.await("""
            globalThis.taps = [];
            class TapHandler extends native.NSObject {
              static ObjCExposedMethods = { tapped: { params: [native.UIButton], returns: native.interop.types.void } };
              static { native.NativeClass(this); }
              tapped(sender) {
                taps.push(native.NSThread.isMainThread);
                sender.setTitleForState('tapped ' + taps.length, 0);   // UIKit, inside the callback
              }
            }
            await onMain(() => {
              globalThis.handler = TapHandler.new();
              globalThis.button = native.UIButton.buttonWithType(0);
              button.addTargetActionForControlEvents(handler, 'tapped', 1 << 6);   // selector = the ObjCExposedMethods key   // .touchUpInside
            });
            """)
        if let button = await objc("button", as: UIButton.self) {
            await MainActor.run {
                for _ in 0..<3 { button.sendActions(for: .touchUpInside) }
            }
            let title = await MainActor.run { button.title(for: .normal) }
            let onMain = await thread.run { [self] in js("taps.join()").toString() ?? "" }
            log.check("JS target-action runs on main and can call UIKit synchronously",
                      title == "tapped 3" && onMain == "true,true,true", "title '\(title ?? "nil")', main: \(onMain)")
        } else {
            log.check("JS target-action", false, "couldn't get the button")
        }

        // 4b. A *block* fired on main (UIAction handler). Methods run on the
        // calling thread anyway; blocks go through the threadsafe-function path.
        _ = await self.await("""
            globalThis.actionThreads = [];
            await onMain(() => {
              globalThis.actionLabel = native.UILabel.new();
              globalThis.actionButton = native.UIButton.buttonWithType(0);
              const action = native.UIAction.actionWithHandler((a) => {
                actionThreads.push(native.NSThread.isMainThread);
                actionLabel.text = 'action ' + actionThreads.length;   // UIKit inside a block callback
              });
              actionButton.addActionForControlEvents(action, 1 << 6);
            });
            """)
        log.add("   MTC-BLOCK-BEGIN")
        if let actionButton = await objc("actionButton", as: UIButton.self) {
            await MainActor.run { for _ in 0..<2 { actionButton.sendActions(for: .touchUpInside) } }
            try? await Task.sleep(for: .milliseconds(100))
            let threads = await thread.run { [self] in js("actionThreads.join()").toString() ?? "" }
            log.check("UIAction block handler runs its UIKit on main", threads == "true,true", "main: \(threads)")
        }
        log.add("   MTC-BLOCK-END")
        await onJS { [self] in
            js("""
                globalThis.noteThreads = [];
                native.NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
                  'SpikeMainNote', null, null, () => noteThreads.push(native.NSThread.isMainThread));
                """)
        }
        await MainActor.run { NotificationCenter.default.post(name: Notification.Name("SpikeMainNote"), object: nil) }
        try? await Task.sleep(for: .milliseconds(100))
        let noteThread = await thread.run { [self] in js("noteThreads.join()").toString() ?? "" }
        log.add("   block created on JS thread, fired on main → ran on main: \(noteThread)")

        // 5. A JS UITableViewDataSource: UIKit needs cells back synchronously.
        _ = await self.await("""
            class Rows extends native.NSObject {
              static ObjCProtocols = [native.UITableViewDataSource];
              static { native.NativeClass(this); }
              tableViewNumberOfRowsInSection(tableView, section) { return 20; }
              tableViewCellForRowAtIndexPath(tableView, indexPath) {
                const cell = native.UITableViewCell.alloc().initWithStyleReuseIdentifier(0, 'row');
                cell.textLabel.text = 'row ' + indexPath.row + (native.NSThread.isMainThread ? '' : ' (OFF MAIN)');
                return cell;
              }
            }
            await onMain(() => {
              globalThis.rows = Rows.new();
              globalThis.table = native.UITableView.alloc().initWithFrameStyle(native.CGRectMake(0, 0, 320, 480), 0);
              table.dataSource = rows;
            });
            """)
        if let table = await objc("table", as: UITableView.self) {
            let texts = await MainActor.run { () -> [String] in
                table.reloadData()
                table.layoutIfNeeded()
                return table.visibleCells.compactMap { $0.textLabel?.text }
            }
            log.check("JS UITableViewDataSource returns cells synchronously on main",
                      texts.count >= 5 && texts.allSatisfy { !$0.contains("OFF MAIN") },
                      "\(texts.count) visible: \(texts.prefix(3).joined(separator: ", "))…")
        } else {
            log.check("JS UITableViewDataSource", false, "couldn't get the table")
        }

        // 6. Contention: main calls into JS while the JS thread is busy.
        if let button = await objc("button", as: UIButton.self) {
            thread.perform { [self] in js("const t = Date.now(); while (Date.now() - t < 300) {}") }
            try? await Task.sleep(for: .milliseconds(20))
            let t0 = Date()
            await MainActor.run { button.sendActions(for: .touchUpInside) }
            let ms = Date().timeIntervalSince(t0) * 1000
            log.check("callback while JS is busy waits for the VM lock, no deadlock", true,
                      String(format: "main waited %.0f ms (JS was mid-way through 300 ms of work)", ms))
        }

        // 6b. Same, but the JS work is time-sliced the way React's concurrent
        // renderer works: ~5 ms chunks, returning to the run loop in between.
        let later: @convention(block) (JSValue) -> Void = { [thread] fn in thread.perform { fn.call(withArguments: []) } }
        await onJS { [self] in
            app.setObject(later, forKeyedSubscript: "later" as NSString)
            js("""
                globalThis.sliced = (totalMs) => {
                  const end = Date.now() + totalMs;
                  const slice = () => { const t = Date.now(); while (Date.now() - t < 5 && Date.now() < end) {} if (Date.now() < end) later(slice); };
                  slice();
                };
                """)
        }
        if let button = await objc("button", as: UIButton.self) {
            var waits: [Double] = []
            thread.perform { [self] in js("sliced(300)") }
            for _ in 0..<10 {
                try? await Task.sleep(for: .milliseconds(20))
                let t0 = Date()
                await MainActor.run { button.sendActions(for: .touchUpInside) }   // NativeScript brackets the callback
                waits.append(Date().timeIntervalSince(t0) * 1000)
            }
            log.check("with ~5 ms slices, main never waits long for the VM", (waits.max() ?? 99) < 16,
                      String(format: "10 taps during 300 ms of sliced JS: max wait %.1f ms, median %.1f ms",
                             waits.max() ?? 0, waits.sorted()[waits.count / 2]))
        }

        // 7. Many hops both ways.
        let t0 = Date()
        let rounds = await self.await("""
            let n = 0;
            for (let i = 0; i < 200; i++) n += await onMain(() => (native.NSThread.isMainThread ? 1 : 0));
            return n;
            """)
        let hopMs = Date().timeIntervalSince(t0) * 1000
        var tapMs = 0.0
        if let button = await objc("button", as: UIButton.self) {
            tapMs = await MainActor.run { () -> Double in
                let t = Date()
                for _ in 0..<200 { button.sendActions(for: .touchUpInside) }
                return Date().timeIntervalSince(t) * 1000
            }
        }
        let tapCount = await thread.run { [self] in js("taps.length").toInt32() }
        log.check("200 onMain round trips + 200 main→JS callbacks", rounds?.toInt32() == 200 && tapCount == 214,
                  String(format: "onMain %.2f ms each; JS callback on main %.3f ms each", hopMs / 200, tapMs / 200))
    }
}
