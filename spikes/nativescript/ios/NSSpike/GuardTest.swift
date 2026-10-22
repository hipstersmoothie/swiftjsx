// SPIKE: main-thread guard (napi-ios-main-thread-guard.patch).
//
// With nativescript_set_main_thread_guard(true), calling a @MainActor
// Objective-C member from the JS thread throws instead of running. Run with
// Main Thread Checker to confirm guarded calls never reach UIKit:
//
//   SIMCTL_CHILD_SPIKE_GUARD=1 SIMCTL_CHILD_DYLD_INSERT_LIBRARIES=/usr/lib/libMainThreadChecker.dylib \
//     xcrun simctl launch --console-pty <udid> dev.swiftjsx.nsspike
//
// MTC reports are counted between the MTC-*-BEGIN/END markers in the output.

import Foundation
import JavaScriptCore
import MachO
import NodeAPIJSC

final class GuardRunner: @unchecked Sendable {
    let log: SpikeLog
    let base: ThreadModelRunner

    init(log: SpikeLog) {
        self.log = log
        self.base = ThreadModelRunner(log: log)
    }

    /// Runs `body` (JS returning a JSON array of {label, ok, detail}) and logs each result.
    func report(_ section: String, _ json: String?) {
        guard let json, let data = json.data(using: .utf8),
              let rows = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            log.check("\(section): results", false, json ?? "nil")
            return
        }
        for row in rows {
            log.check("\(section): \(row["label"] as? String ?? "?")", row["ok"] as? Bool ?? false,
                      row["detail"] as? String ?? "")
        }
    }

    func run() async {
        await base.setUp()
        let enabled = sjsx_set_main_thread_guard(1)
        let mtc = (0..<_dyld_image_count()).contains { String(cString: _dyld_get_image_name($0)).contains("libMainThreadChecker") }
        log.add("== Main-thread guard. Exported: \(enabled == 1). Main Thread Checker loaded: \(mtc)")

        // Fixtures: built on main, used from the JS thread.
        _ = await base.await("""
            globalThis.expectThrow = (label, fn, needles) => {
              try { fn(); return { label, ok: false, detail: 'did not throw' }; }
              catch (e) {
                const message = String((e && e.message) || e);
                const ok = needles.every((n) => message.includes(n)) && e.code === 'ERR_NATIVESCRIPT_MAIN_THREAD';
                return { label, ok, detail: message };
              }
            };
            globalThis.expectOk = (label, fn) => {
              try { return { label, ok: true, detail: String(fn()) }; }
              catch (e) { return { label, ok: false, detail: 'threw: ' + ((e && e.message) || e) }; }
            };
            class GuardView extends native.UIView {
              static { native.NativeClass(this); }
            }
            globalThis.GuardView = GuardView;
            globalThis.delegateCalls = [];
            class GuardDelegate extends native.NSObject {
              static ObjCProtocols = [native.UITextFieldDelegate];   // a @MainActor protocol
              static { native.NativeClass(this); }
              textFieldDidBeginEditing(textField) { delegateCalls.push(native.NSThread.isMainThread); }
            }
            globalThis.GuardDelegate = GuardDelegate;
            await onMain(() => {
              globalThis.mainView = native.UIView.new();
              globalThis.gv = GuardView.new();
              globalThis.uiApp = native.UIApplication.sharedApplication;
            });
            globalThis.plain = native.NSObject.new();
            """)

        // 1. Guarded calls from the JS thread throw, and never reach UIKit.
        log.add("   MTC-GUARD-BEGIN")
        let thrown = await base.thread.run { [self] in
            base.js("""
                JSON.stringify([
                  expectThrow('UILabel.new()', () => native.UILabel.new(),
                    ['UILabel.new() must be called on the main thread (UILabel is @MainActor). Wrap it in onMain(() => ...).']),
                  expectThrow('UIView.alloc().init()', () => native.UIView.alloc().init(),
                    ['UIView.alloc() must be called on the main thread (UIView is @MainActor)']),
                  expectThrow('new UIView()', () => new native.UIView(),
                    ['new UIView() must be called on the main thread (UIView is @MainActor)']),
                  expectThrow('UIApplication.sharedApplication', () => native.UIApplication.sharedApplication,
                    ['UIApplication.sharedApplication must be accessed on the main thread (UIApplication is @MainActor)']),
                  expectThrow('view.backgroundColor = … (view made in onMain)', () => { mainView.backgroundColor = native.UIColor.redColor; },
                    ['UIView.backgroundColor = ... must be accessed on the main thread (UIView is @MainActor)']),
                  expectThrow('JS subclass: gv.setNeedsLayout() (declared on UIView)', () => gv.setNeedsLayout(),
                    ['UIView.setNeedsLayout() must be called on the main thread (UIView is @MainActor)']),
                  expectThrow('JS subclass: GuardView.new()', () => GuardView.new(),
                    ['GuardView.new() must be called on the main thread (GuardView inherits @MainActor from UIView)']),
                  expectThrow('UIButton.buttonWithType(0) (class method)', () => native.UIButton.buttonWithType(0),
                    ['UIButton.buttonWithType() must be called on the main thread (UIButton is @MainActor)']),
                  expectThrow('member-level @MainActor on NSObject: plain.accessibilityLabel', () => plain.accessibilityLabel,
                    ['NSObject.accessibilityLabel must be accessed on the main thread (accessibilityLabel is @MainActor)']),
                  expectThrow('mainView.addSubview(gv)', () => mainView.addSubview(gv),
                    ['UIView.addSubview() must be called on the main thread (UIView is @MainActor)']),
                  expectThrow('mainView.layoutIfNeeded()', () => mainView.layoutIfNeeded(),
                    ['UIView.layoutIfNeeded() must be called on the main thread (UIView is @MainActor)']),
                ])
                """).toString()
        }
        log.add("   MTC-GUARD-END")
        report("JS thread, guarded, throws", thrown)
        let untouched = await base.await("return await onMain(() => String([mainView.backgroundColor, mainView.subviews.count]));")
        log.check("JS thread, guarded: rejected calls had no effect (backgroundColor still null, no subviews)",
                  untouched?.toString() == ",0", "[backgroundColor, subviews.count] = [\(untouched?.toString() ?? "nil")]")

        // 2. Allowed from the JS thread.
        log.add("   MTC-ALLOWED-BEGIN")
        let allowed = await base.thread.run { [self] in
            base.js("""
                JSON.stringify([
                  expectOk('UIColor.redColor (Sendable)', () => native.UIColor.redColor.description),
                  expectOk("UIImage.systemImageNamed('star') (Sendable)", () => native.UIImage.systemImageNamed('star') != null),
                  expectOk('NSMutableParagraphStyle.new() (TextKit, unannotated)', () => { const p = native.NSMutableParagraphStyle.new(); p.lineSpacing = 4; return p.lineSpacing; }),
                  expectOk('NSProcessInfo.processInfo.processName (Foundation)', () => native.NSProcessInfo.processInfo.processName),
                  expectOk('nonisolated UIApplication.backgroundTimeRemaining', () => uiApp.backgroundTimeRemaining > 0),
                  expectOk('nonisolated UIApplication.protectedDataAvailable', () => uiApp.protectedDataAvailable),
                  expectOk('NSObject member on a view: mainView.isKindOfClass(UIView)', () => mainView.isKindOfClass(native.UIView)),
                  expectOk('JS method of a @MainActor protocol, invoked by native code on the JS thread', () => {
                    globalThis.guardDelegate = GuardDelegate.new();
                    guardDelegate.performSelectorWithObjectAfterDelay('textFieldDidBeginEditing:', null, 0);
                    return 'scheduled';
                  }),
                ])
                """).toString()
        }
        try? await Task.sleep(for: .milliseconds(200))
        log.add("   MTC-ALLOWED-END")
        report("JS thread, allowed", allowed)
        let calls = await base.thread.run { [self] in base.js("delegateCalls.join()").toString() ?? "" }
        log.check("JS thread, allowed: native → JS delegate callback ran (on the JS thread, unguarded)", calls == "false", "isMainThread: [\(calls)]")

        // 3. The same guarded calls inside onMain succeed.
        let onMainResults = await base.await("""
            return await onMain(() => JSON.stringify([
              expectOk('UILabel.new()', () => native.UILabel.new() != null),
              expectOk('UIView.alloc().init()', () => native.UIView.alloc().init() != null),
              expectOk('new UIView()', () => new native.UIView() != null),
              expectOk('UIApplication.sharedApplication', () => native.UIApplication.sharedApplication === uiApp),
              expectOk('view.backgroundColor = …', () => { mainView.backgroundColor = native.UIColor.redColor; return mainView.backgroundColor.isEqual(native.UIColor.redColor); }),
              expectOk('gv.setNeedsLayout()', () => { gv.setNeedsLayout(); return true; }),
              expectOk('GuardView.new()', () => GuardView.new() != null),
              expectOk('UIButton.buttonWithType(0)', () => native.UIButton.buttonWithType(0) != null),
              expectOk('plain.accessibilityLabel', () => String(plain.accessibilityLabel)),
            ]));
            """)
        report("onMain, guarded calls succeed", onMainResults?.toString())

        // 4. Overhead. Unguarded call on the JS thread, guarded-but-allowed call on main,
        // each with the guard off and on; best of 5 rounds.
        let n = 200_000
        _ = await base.await("""
            globalThis.pinfo = native.NSProcessInfo.processInfo;
            globalThis.benchJS = (n) => { const t = Date.now(); let s = 0; for (let i = 0; i < n; i++) s += pinfo.processIdentifier; return (Date.now() - t) * 1e6 / n; };
            globalThis.benchMain = (n) => { const t = Date.now(); let s = 0; for (let i = 0; i < n; i++) s += mainView.tag; return (Date.now() - t) * 1e6 / n; };
            benchJS(1000); await onMain(() => benchMain(1000));
            """)
        var best: [String: Double] = [:]
        for _ in 0..<5 {
            for on in [false, true] {
                _ = sjsx_set_main_thread_guard(on ? 1 : 0)
                let js = await base.thread.run { [self] in base.js("benchJS(\(n))").toDouble() }
                let main = await base.await("return await onMain(() => benchMain(\(n)));")?.toDouble() ?? .nan
                for (key, value) in [("js-\(on)", js), ("main-\(on)", main)] { best[key] = min(best[key] ?? .infinity, value) }
            }
        }
        _ = sjsx_set_main_thread_guard(1)
        func row(_ name: String, _ key: String) -> String {
            let off = best["\(key)-false"]!, on = best["\(key)-true"]!
            return String(format: "%@: off %.0f ns, on %.0f ns, diff %+.0f ns/call", name, off, on, on - off)
        }
        log.add("   BENCH " + row("unguarded NSProcessInfo.processIdentifier, JS thread", "js"))
        log.add("   BENCH " + row("guarded-but-allowed UIView.tag, main thread", "main"))

        // 5. Guard disabled: the same calls run off main again (MTC reports them).
        _ = sjsx_set_main_thread_guard(0)
        log.add("   MTC-DISABLED-BEGIN")
        let disabled = await base.thread.run { [self] in
            base.js("""
                JSON.stringify([
                  expectOk('UIView.alloc().init()', () => native.UIView.alloc().init() != null),
                  expectOk('UIApplication.sharedApplication', () => native.UIApplication.sharedApplication === uiApp),
                  expectOk('view.backgroundColor = …', () => { mainView.backgroundColor = native.UIColor.blueColor; return true; }),
                  expectOk('gv.setNeedsLayout()', () => { gv.setNeedsLayout(); return true; }),
                  expectOk('plain.accessibilityLabel', () => String(plain.accessibilityLabel)),
                  expectOk('mainView.addSubview(gv)', () => { mainView.addSubview(gv); return mainView.subviews.count; }),
                  expectOk('mainView.layoutIfNeeded()', () => { mainView.layoutIfNeeded(); return true; }),
                ])
                """).toString()
        }
        log.add("   MTC-DISABLED-END")
        report("guard disabled, JS thread, calls run", disabled)
    }
}
