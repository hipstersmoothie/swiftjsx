import Foundation
import Testing
@testable import SwiftJSX

/// The native backend (NativeScript), on macOS. Needs the add-on built by
/// scripts/build-nativescript.sh (build/nativescript/macos/…); skipped otherwise.
let macAddon = URL(fileURLWithPath: #filePath)
    .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
    .appendingPathComponent("build/nativescript/macos/macos-arm64/NativeScript.framework/Versions/A/NativeScript")
let hasMacAddon = FileManager.default.fileExists(atPath: macAddon.path)

@MainActor
@Suite(.serialized, .enabled(if: hasMacAddon, "build the NativeScript add-on first"))
struct NativeTests {
    func makeRuntime() async throws -> JSXRuntime {
        let runtime = JSXRuntime(threading: .background, native: NativeOptions(addonURL: macAddon))
        runtime.load(app: try fixtureSource("Native"))
        // NativeScript's start-up (metadata, a sibling context) slows under parallel tests.
        #expect(await eventually(timeout: .seconds(10)) { runtime.texts().contains("available true") })
        return runtime
    }

    @Test func callsNativeAPIs() async throws {
        let runtime = try await makeRuntime()
        let name = ProcessInfo.processInfo.processName
        #expect(await eventually { runtime.texts().contains("process \(name)") })
        #expect(runtime.error == nil)
    }

    @Test func nativeViewsAreHandedToSwift() async throws {
        let runtime = try await makeRuntime()
        #expect(await eventually { runtime.texts().contains("native view true") })
        let node = try #require(runtime.all().first { $0.type == "NativeView" })
        #expect(await eventually { node.string("viewKey") != nil })
        let view = NativeViewHost.view(for: node.string("viewKey"))
        #expect(view?.toolTip == "made in JS")
    }

    @Test func onMainRunsOnMainAndResumesOnTheJSThread() async throws {
        let runtime = try await makeRuntime()
        runtime.press("hop")
        #expect(await eventually { runtime.texts().contains("hop true") })
        #expect(await eventually { runtime.texts().contains("after false") })
    }

    @Test func blocksFiredOnMainRunOnMain() async throws {
        let runtime = try await makeRuntime()
        runtime.press("observe")
        #expect(await eventually { runtime.texts().contains("note observing") })
        NotificationCenter.default.post(name: Notification.Name("SwiftJSXTestNote"), object: nil)   // on main
        #expect(await eventually { runtime.texts().contains("note true") })
    }

    @Test func nativeClassesFromJS() async throws {
        let runtime = try await makeRuntime()
        runtime.press("classes")
        #expect(await eventually { runtime.texts().contains("classes pong a|pang b|evicted one") })
        #expect(runtime.error == nil)
    }

    @Test func nativePromiseSettlesOnTheJSThread() async throws {
        let runtime = try await makeRuntime()
        runtime.press("promise")
        #expect(await eventually { runtime.texts().contains("promise false then false") })
    }

    @Test func objectiveCExceptionsThrowInJS() async throws {
        let runtime = try await makeRuntime()
        runtime.press("exception")
        #expect(await eventually { runtime.texts().contains { $0.hasPrefix("exception threw") } })
        #expect(runtime.error == nil)
    }

    @Test func callbacksIntoADeadContextAreIgnored() async throws {
        var runtime: JSXRuntime? = try await makeRuntime()
        runtime!.press("leave a delegate behind")
        #expect(await eventually { Thread.main.threadDictionary["SwiftJSXTestCache"] != nil })
        weak var gone = runtime
        runtime = nil
        #expect(await eventually { gone == nil })
        try await Task.sleep(for: .milliseconds(300))
        // Evicting calls the delegate, whose JS context is gone: ignored, no crash.
        let cache = try #require(Thread.main.threadDictionary["SwiftJSXTestCache"] as? NSCache<AnyObject, AnyObject>)
        cache.setObject("next" as NSString, forKey: "k2" as NSString)
        cache.removeAllObjects()
        Thread.main.threadDictionary.removeObject(forKey: "SwiftJSXTestCache")
    }

    @Test func keyValueObserving() async throws {
        let runtime = try await makeRuntime()
        runtime.press("kvo")
        // The initial value, both changes, and nothing after stop().
        let ok = await eventually { runtime.texts().contains("kvo 0,3,7") }
        if !ok { print("KVO texts:", runtime.texts().filter { $0.hasPrefix("kvo") }, runtime.error ?? "no error") }
        #expect(ok)
        try await Task.sleep(for: .milliseconds(200))
        #expect(runtime.texts().contains("kvo 0,3,7"))
    }

    @Test func errorsInsideOnMainReject() async throws {
        let runtime = try await makeRuntime()
        runtime.press("reject")
        #expect(await eventually { runtime.texts().contains("reject rejected boom") })
        #expect(runtime.error == nil)
    }

    @Test func useNativeValueRefreshesOnNotifications() async throws {
        let runtime = try await makeRuntime()
        #expect(await eventually { runtime.texts().contains { $0.hasPrefix("reads ") && $0 != "reads 0" } })
        let before = runtime.texts().first { $0.hasPrefix("reads ") }!
        NotificationCenter.default.post(name: Notification.Name("SwiftJSXTestRefresh"), object: nil)
        #expect(await eventually { runtime.texts().contains { $0.hasPrefix("reads ") && $0 != before } })
    }

    /// The bug that ruled out a GCD queue: a callback created in one job and
    /// called by native code in a later job (on a different worker thread)
    /// looked cross-thread to NativeScript and deadlocked.
    @Test func callbacksCreatedInEarlierJobsStillWork() async throws {
        let runtime = try await makeRuntime()
        for _ in 0..<5 {
            runtime.press("make sorter")
            try await Task.sleep(for: .milliseconds(400))
            runtime.press("sort")
            #expect(await eventually(timeout: .seconds(3)) { runtime.texts().contains("sorted 1,2,3") })
        }
    }

    /// NativeScript's main-thread guard (napi-ios-main-thread-guard.patch):
    /// @MainActor API called from the JS thread throws instead of running.
    @Test func mainThreadGuard() async throws {
        let runtime = JSXRuntime(threading: .background, native: NativeOptions(addonURL: macAddon))
        runtime.load(app: try fixtureSource("Guard"))
        #expect(await eventually { runtime.texts().contains("guard true") })
        runtime.press("off main")
        #expect(await eventually { runtime.texts().contains { $0.hasPrefix("off threw ERR_NATIVESCRIPT_MAIN_THREAD:") } })
        #expect(runtime.texts().contains { $0.contains("NSView") && $0.contains("onMain") }, "message names the class and the fix")
        runtime.press("on main")
        #expect(await eventually { runtime.texts().contains("on ran") })
        runtime.press("allowed")
        #expect(await eventually { runtime.texts().contains("allowed ran") })
        #expect(runtime.error == nil)
    }

    @Test func withoutTheBackendNativeIsUnavailable() async throws {
        let runtime = JSXRuntime(threading: .background)
        runtime.load(app: try fixtureSource("NoNative"))
        #expect(await eventually { runtime.texts().contains("available false") })
        runtime.press("hop")
        #expect(await eventually { runtime.texts().contains { $0.hasPrefix("hop error: onMain() needs the native backend") } })
        runtime.press("access")
        #expect(await eventually { runtime.texts().contains { $0.hasPrefix("access error: native.NSProcessInfo: the native backend is off") } })
        #expect(runtime.error == nil)
    }
}
